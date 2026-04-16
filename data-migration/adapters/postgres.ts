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

    const pkRows = await this.db.any(
      `
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = $1
  `,
      [schemaName],
    );

    for (const row of pkRows) {
      if (!result[row.table_name]) {
        result[row.table_name] = {
          primaryKey: row.column_name,
          foreignKeys: [],
        };
      } else {
        result[row.table_name].primaryKey = row.column_name;
      }
    }

    const fkRows = await this.db.any(
      `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = $1
  `,
      [schemaName],
    );

    for (const row of fkRows) {
      if (!result[row.table_name]) {
        result[row.table_name] = {
          primaryKey: "id",
          foreignKeys: [],
        };
      }

      result[row.table_name].foreignKeys.push({
        field: row.column_name,
        references: {
          table: row.foreign_table_name,
          field: row.foreign_column_name,
        },
      });
    }

    return result;
  }
}
