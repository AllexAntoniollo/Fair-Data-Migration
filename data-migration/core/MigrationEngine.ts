import { Neo4JAdapter } from "@/adapters/neo4j";
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

    let fullSchema: Record<string, TableSchema> = {};

    if (adapter.listSchema) {
      fullSchema = await adapter.listSchema("public");
    }

    for (const table of selectedTables) {
      const destTable = tableMappings?.[table] || table;
      const columns = selectedColumns[table] || [];

      try {
        const data = await adapter.read(table, columns.join(", "));

        dataDict[destTable] = data.map((record) => {
          const mapping = columnMappings?.[table] || {};
          if (!mapping || Object.keys(mapping).length === 0) {
            return record;
          }

          const mappedRecord: any = {};
          for (const col of columns) {
            if (record.hasOwnProperty(col)) {
              const destCol = mapping[col] || col;
              mappedRecord[destCol] = record[col];
            }
          }
          return mappedRecord;
        });
      } catch (error) {
        console.error(`Erro ao ler tabela ${table}:`, error);
        dataDict[destTable] = [];
      }

      const tableSchema = fullSchema[table];
      const columnMap = columnMappings?.[table] || {};

      if (tableSchema) {
        const mappedPK =
          columnMap[tableSchema.primaryKey] || tableSchema.primaryKey;

        const mappedFKs = tableSchema.foreignKeys.map((fk) => ({
          field: columnMap[fk.field] || fk.field,
          isUnique: fk.isUnique,
          references: {
            table: tableMappings?.[fk.references.table] || fk.references.table,
            field: fk.references.field,
          },
        }));

        const mappedColumns = (tableSchema.columns || columns).map(
          (col) => columnMap[col] || col,
        );

        schemaDict[destTable] = {
          primaryKey: mappedPK,
          foreignKeys: mappedFKs,
          columns: mappedColumns,
        };
      } else {
        schemaDict[destTable] = {
          primaryKey: "id",
          foreignKeys: [],
          columns: columns.map((col) => columnMap[col] || col),
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
    if (adapter instanceof Neo4JAdapter) {
      await adapter.write("", [data]);
    } else {
      for (const [table, records] of Object.entries(data.data)) {
        await adapter.write(table, records);
      }
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
