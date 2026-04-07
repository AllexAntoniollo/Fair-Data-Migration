export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  read(collection: string, params?: string): Promise<any[]>;
  write(collection: string, data: any[]): Promise<void>;

  clear?(collection: string): Promise<void>;
  listTables(schemaName: string): Promise<string[]>;
  createTable(tableName: string): Promise<void>;
  listColumns(table: string, schemaName?: string): Promise<string[]>;
}
export type ModeloIntermediario = {
  data: { [key: string]: any[] };
};
