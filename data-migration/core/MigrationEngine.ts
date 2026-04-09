import { DatabaseAdapter, ModeloIntermediario, TableSchema } from "./types";

export class MigrationEngine {
  async createModel(
    adapter: DatabaseAdapter,
    selectedTables: string[],
    selectedColumns: { [table: string]: string[] },
    columnMappings: Record<string, Record<string, string>> = {},
    tableMappings: Record<string, string> = {},
  ): Promise<ModeloIntermediario> {
    const dataDict: { [key: string]: any[] } = {};
    const schemaDict: Record<string, TableSchema> = {};

    // 🔥 1. Buscar schema completo do banco

    let fullSchema: Record<string, TableSchema> = {};

    if (adapter.listSchema) {
      fullSchema = await adapter.listSchema("public");
    }

    for (const table of selectedTables) {
      const destTable = tableMappings?.[table] || table;

      try {
        const columns = selectedColumns[table] || [];
        const data = await adapter.read(table, columns.join(", "));

        dataDict[destTable] = data.map((record) => {
          const mapping = columnMappings?.[table] || {};
          if (!mapping || Object.keys(mapping).length === 0) {
            return record;
          }

          const mappedRecord: any = {};
          for (const [sourceCol, value] of Object.entries(record)) {
            const destCol = mapping[sourceCol] || sourceCol;
            mappedRecord[destCol] = value;
          }
          return mappedRecord;
        });
      } catch (error) {
        console.error(`Erro ao ler tabela ${table}:`, error);
        dataDict[destTable] = [];
      }

      // 🧠 2. Montar schema da tabela (PK + FK)

      const tableSchema = fullSchema[table];

      if (tableSchema) {
        const columnMap = columnMappings?.[table] || {};

        // 🔑 mapear PK (caso coluna tenha sido renomeada)
        const mappedPK =
          columnMap[tableSchema.primaryKey] || tableSchema.primaryKey;

        // 🔗 mapear FKs (coluna e nome da tabela)
        const mappedFKs = tableSchema.foreignKeys.map((fk) => ({
          field: columnMap[fk.field] || fk.field,
          references: {
            table: tableMappings?.[fk.references.table] || fk.references.table,
            field: fk.references.field,
          },
        }));

        schemaDict[destTable] = {
          primaryKey: mappedPK,
          foreignKeys: mappedFKs,
        };
      } else {
        // fallback
        schemaDict[destTable] = {
          primaryKey: "id",
          foreignKeys: [],
        };
      }
    }

    return {
      data: dataDict,
      schema: schemaDict,
    };
  }

  async importData(
    adapter: DatabaseAdapter,
    data: ModeloIntermediario,
  ): Promise<void> {
    for (const [table, records] of Object.entries(data.data)) {
      await adapter.write(table, records);
    }
  }

  downloadModeloIntermediario(
    data: ModeloIntermediario,
    filename: string = "modelo-intermediario.json",
  ): void {
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }
}
