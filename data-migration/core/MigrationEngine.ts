import { DatabaseAdapter, ModeloIntermediario } from "./types";
import { writeFileSync } from "fs";

export class MigrationEngine {
  async createModel(
    adapter: DatabaseAdapter,
    selectedTables: string[],
    selectedColumns: { [table: string]: string[] },
    columnMappings: Record<string, Record<string, string>> = {},
    tableMappings: Record<string, string> = {},
  ): Promise<ModeloIntermediario> {
    const dataDict: { [key: string]: any[] } = {};

    for (const table of selectedTables) {
      try {
        const columns = selectedColumns[table] || [];
        const data = await adapter.read(table, columns.join(", "));
        const destTable = tableMappings?.[table] || table;

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
        const destTable = tableMappings?.[table] || table;
        dataDict[destTable] = [];
      }
    }

    return { data: dataDict };
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
