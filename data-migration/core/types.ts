export type ForeignKey = {
  field: string;
  isUnique: boolean;
  references: {
    table: string;
    field: string;
  };
};

export type TableSchema = {
  primaryKey: string;
  foreignKeys: ForeignKey[];
  columns: string[];
};

export type GraphMapping = {
  type: "node" | "edge";
  isJoinTable?: boolean;
  unifiedTables?: string[];
  edges?: {
    field: string;
    targetTable: string;
  }[];
};

export type ModeloIntermediario = {
  data: { [table: string]: any[] };
  schema: { [table: string]: TableSchema };
  mapping?: {
    [table: string]: GraphMapping;
  };
};

export interface GraphenedUserInput {
  MAX_NKEY?: number; // Default 2
  MAX_UATT?: number; // Default 100%
  NJTab?: string[]; // Tabelas proibidas de serem Join Tables
  JTab?: string[]; // Tabelas forçadas a serem Join Tables
  NUTab?: string[]; // Tabelas proibidas de serem unificadas
}
export type AlgorithmInfo = {
  id: number;
  name: string;
  description: string;
};
export interface DatabaseAdapter {
  connect(): Promise<void>;

  read(collection: string, params?: string): Promise<any[]>;
  write(collection: string, data: any[]): Promise<void>;

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
