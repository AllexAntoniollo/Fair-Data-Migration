import { DatabaseConfig, DatabaseType } from "@/types/database";
import { ModeloIntermediario } from "@/core/types";

interface ApiResponse<T> {
  success: boolean;
  error?: string;
}

type ApiResult<T> = ApiResponse<T>;

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function handleResponse<T>(
  response: Response,
  errorMessage: string,
): Promise<T> {
  if (!response.ok) {
    throw new Error(`${errorMessage}: ${response.statusText}`);
  }

  const data = (await response.json()) as ApiResult<T>;

  if (!data.success) {
    throw new Error(data.error || errorMessage);
  }

  return data as T;
}

export async function listTables(config: DatabaseConfig): Promise<string[]> {
  const response = await fetch("/api/database/tables", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(config),
  });

  const data = await handleResponse<{ tables: string[] }>(
    response,
    "Erro ao listar tabelas",
  );

  return data.tables;
}

export async function listColumns(
  config: DatabaseConfig,
  tables: string[],
): Promise<Record<string, string[]>> {
  const response = await fetch("/api/database/columns", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ config, tables }),
  });

  const data = await handleResponse<{ columns: Record<string, string[]> }>(
    response,
    "Erro ao listar colunas",
  );

  return data.columns;
}

export async function exportDatabase(
  config: DatabaseConfig,
  tables: string[],
  columns: Record<string, string[]>,
  columnMappings: Record<string, Record<string, string>>,
  tableMappings: Record<string, string>,
  destinationType: DatabaseType | "",
  algorithm: number,
): Promise<ModeloIntermediario> {
  const response = await fetch("/api/database/export", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      config,
      destinationType,
      algorithm,
      tables,
      columns,
      columnMappings,
      tableMappings,
    }),
  });

  const data = await handleResponse<{ data: ModeloIntermediario }>(
    response,
    "Erro ao exportar dados",
  );

  return data.data;
}

export async function importDatabase(
  config: DatabaseConfig,
  data: ModeloIntermediario,
): Promise<void> {
  const response = await fetch("/api/database/import", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ config, data }),
  });

  await handleResponse<{ message?: string }>(
    response,
    "Erro ao importar dados",
  );
}

export async function listAlgorithms(config: DatabaseConfig): Promise<any[]> {
  const response = await fetch("/api/database/algorithms", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(config),
  });

  const data = await handleResponse<{ algorithms: any[] }>(
    response,
    "Erro ao listar algoritmos",
  );

  return data.algorithms;
}
