import pgPromise, { IDatabase } from "pg-promise";
import {
  AlgorithmInfo,
  DatabaseAdapter,
  ModeloIntermediario,
  TableSchema,
} from "../core/types";

export class PostgresAdapter implements DatabaseAdapter {
  constructor(private db: IDatabase<any>) {}

  async connect() {
    try {
      const result = await this.db.one("SELECT 1 AS ok");
    } catch (error) {
      console.error("Erro ao conectar no Postgres:", error);
      throw error;
    }
  }

  async read(table: string, params: string) {
    return this.db.any(`SELECT ${params} FROM ${table}`);
  }

  async listTables(schemaName: string): Promise<string[]> {
    const result = await this.db.any(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
    `,
      [schemaName],
    );

    return result.map((r: any) => r.table_name);
  }

  async createTable(tableName: string, schema?: any): Promise<void> {
    let query = "";

    if (typeof schema === "string") {
      query = schema;
    } else if (typeof schema === "object" && schema !== null) {
      const columns = Object.entries(schema).map(([key, value]) => {
        let type = "TEXT";

        if (typeof value === "number") type = "INTEGER";
        if (typeof value === "boolean") type = "BOOLEAN";

        if (typeof value === "string" && !isNaN(Date.parse(value))) {
          type = "TIMESTAMPTZ";
        }

        if (key === "_id") {
          return `"${key}" TEXT PRIMARY KEY`;
        }

        return `"${key}" ${type}`;
      });

      query = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        ${columns.join(",")}
      )
    `;
    } else {
      throw new Error("Schema inválido para criação de tabela");
    }

    await this.db.none(query);
  }

  async write(table: string, data: any[]) {
    const exists = await this.db.oneOrNone(`SELECT to_regclass($1) as name`, [
      table,
    ]);

    if (!exists?.name) {
      await this.createTable(table, data[0]);
    }

    for (const row of data) {
      const columns = Object.keys(row);
      const values = Object.values(row);

      const query = `
        INSERT INTO ${table} (${columns.join(",")})
        VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})
      `;

      await this.db.none(query, values);
    }
  }
  async listColumns(
    table: string,
    schemaName: string = "public",
  ): Promise<string[]> {
    const result = await this.db.any(
      `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
      AND table_schema = $2
    ORDER BY ordinal_position
    `,
      [table, schemaName],
    );

    return result.map((r: any) => r.column_name);
  }

  transformData(
    data: ModeloIntermediario,
    algorithm: number,
  ): ModeloIntermediario {
    switch (algorithm) {
      case 1:
        return this.algorithm1(data);

      default:
        throw new Error("Algoritmo inválido");
    }
  }

  private algorithm1(data: ModeloIntermediario): ModeloIntermediario {
    return data;
  }
  listAlgorithms(): AlgorithmInfo[] {
    return [
      {
        id: 1,
        name: "Identidade",
        description: "Não altera os dados",
      },
    ];
  }
  async listSchema(schemaName: string): Promise<Record<string, TableSchema>> {
    const result: Record<string, TableSchema> = {};

    // 1. Buscar Tabelas e Primary Keys
    const pkRows = await this.db.any(
      `SELECT 
        tc.table_name, 
        kcu.column_name 
     FROM information_schema.table_constraints tc 
     JOIN information_schema.key_column_usage kcu 
       ON tc.constraint_name = kcu.constraint_name 
     WHERE tc.constraint_type = 'PRIMARY KEY' 
       AND tc.table_schema = $1`,
      [schemaName],
    );

    for (const row of pkRows) {
      result[row.table_name] = {
        primaryKey: row.column_name,
        foreignKeys: [],
        // Adicionei 'columns' para o cálculo do MAX_UATT do artigo
        columns: [],
      };
    }

    // 2. Buscar Foreign Keys e verificar se são UNIQUE
    const fkRows = await this.db.any(
      `SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc2
            JOIN information_schema.key_column_usage kcu2 
              ON tc2.constraint_name = kcu2.constraint_name
            WHERE tc2.table_name = tc.table_name 
              AND kcu2.column_name = kcu.column_name
              AND tc2.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
              AND tc2.constraint_name <> tc.constraint_name -- Não é a própria FK
        ) as is_unique
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = $1`,
      [schemaName],
    );

    for (const row of fkRows) {
      if (!result[row.table_name]) {
        result[row.table_name] = {
          primaryKey: "",
          foreignKeys: [],
          columns: [],
        };
      }

      result[row.table_name].foreignKeys.push({
        field: row.column_name,
        isUnique: row.is_unique, // <--- Nova flag para o Algorithm 3
        references: {
          table: row.foreign_table_name,
          field: row.foreign_column_name,
        },
      });
    }

    // 3. (Opcional) Buscar nomes das colunas para respeitar o MAX_UATT do artigo
    const colRows = await this.db.any(
      `SELECT table_name, column_name 
     FROM information_schema.columns 
     WHERE table_schema = $1`,
      [schemaName],
    );

    for (const row of colRows) {
      if (result[row.table_name]) {
        result[row.table_name].columns.push(row.column_name);
      }
    }

    return result;
  }
}
