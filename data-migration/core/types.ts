export type ForeignKey = {
  field: string; // campo na tabela atual
  references: {
    table: string; // tabela referenciada
    field: string; // campo referenciado (geralmente PK)
  };
};

export type TableSchema = {
  primaryKey: string; // ex: "id" ou "tx_hash"
  foreignKeys: ForeignKey[];
};

export type ModeloIntermediario = {
  data: { [key: string]: any[] };
  schema: { [table: string]: TableSchema };
};
export interface AlgorithmInfo {
  id: number;
  name: string;
  description?: string;
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  read(collection: string, params?: string): Promise<any[]>;
  write(collection: string, data: any[]): Promise<void>;

  clear?(collection: string): Promise<void>;
  listTables(schemaName: string): Promise<string[]>;
  createTable(tableName: string): Promise<void>;
  listColumns(table: string, schemaName?: string): Promise<string[]>;
  transformData(
    data: ModeloIntermediario,
    algorithm: number,
  ): ModeloIntermediario;
  listAlgorithms(): AlgorithmInfo[];
  listSchema?(schemaName: string): Promise<Record<string, TableSchema>>;
}
