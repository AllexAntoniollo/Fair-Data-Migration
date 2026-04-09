export type Step =
  | "selectSource"
  | "configSource"
  | "selectDest"
  | "configDest"
  | "preview"
  | "selectTables"
  | "selectColumns"
  | "selectAlgorithm"
  | "migrating";

export type MigrationStage =
  | "idle"
  | "exporting"
  | "exported"
  | "importing"
  | "done";

export const stepTitles: Record<Step, string> = {
  selectSource: "Selecione o Banco de Origem",
  configSource: "Configure a Conexão de Origem",
  selectDest: "Selecione o Banco de Destino",
  configDest: "Configure a Conexão de Destino",
  preview: "Resumo da Migração",
  selectTables: "Selecione as Tabelas para Migrar",
  selectColumns: "Selecione as Colunas",
  selectAlgorithm: "Selecione o Algoritmo de Destino",
  migrating: "Migrando Dados...",
};
