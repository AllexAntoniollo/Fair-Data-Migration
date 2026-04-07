import pgPromise, { IDatabase } from "pg-promise";
import { DatabaseAdapter } from "../core/types";

export class PostgresAdapter implements DatabaseAdapter {
  constructor(private db: IDatabase<any>) {}

  async connect() {
    // pg-promise conecta automaticamente
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
    if (typeof schema === "string") {
      // Assume it's a SQL CREATE TABLE statement
      await this.db.none(schema);
    } else {
      // For now, throw error if not string
      throw new Error("For PostgresAdapter, schema must be a SQL string");
    }
  }

  async write(table: string, data: any[]) {
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

  async disconnect() {
    // opcional
  }
}
