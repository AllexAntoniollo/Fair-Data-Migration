import { NextRequest, NextResponse } from "next/server";
import { PostgresAdapter } from "@/adapters/postgres";
import { MongoAdapter } from "@/adapters/mongo";
import { MigrationEngine } from "@/core/MigrationEngine";
import pgPromise from "pg-promise";
import { MongoClient } from "mongodb";
import { ModeloIntermediario } from "@/core/types";
import { DatabaseType } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      config,
      destinationType,
      algorithm = 1,
      tables,
      columns,
      columnMappings,
      tableMappings,
    } = body;

    const { type, schema = "public", ...connectionConfig } = config;

    let exportedData: ModeloIntermediario = { data: {}, schema: {} };
    const engine = new MigrationEngine();

    if (type === "postgresql") {
      exportedData = await exportPostgres(
        connectionConfig,
        schema,
        tables,
        columns,
        columnMappings,
        tableMappings,
        engine,
      );
    } else if (type === "mongodb") {
      exportedData = await exportMongoDB(
        connectionConfig,
        schema,
        tables,
        columns,
        columnMappings,
        tableMappings,
        engine,
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Tipo de banco de dados não suportado" },
        { status: 400 },
      );
    }

    const transformedData = transformForDestination(
      destinationType,
      algorithm,
      exportedData,
    );

    return NextResponse.json({ success: true, data: transformedData });
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

async function exportPostgres(
  config: any,
  schema: string,
  tables: string[],
  columns: { [table: string]: string[] },
  columnMappings: Record<string, Record<string, string>>,
  tableMappings: Record<string, string>,
  engine: MigrationEngine,
): Promise<ModeloIntermediario> {
  const pgp = pgPromise();
  const pgDb = pgp({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl || false,
  });

  try {
    const adapter = new PostgresAdapter(pgDb);

    const data = await engine.createModel(
      adapter,
      tables,
      columns,
      columnMappings,
      tableMappings,
    );

    await pgp.end();
    return data;
  } catch (error) {
    await pgp.end();
    throw error;
  }
}

async function exportMongoDB(
  config: any,
  schema: string,
  tables: string[],
  columns: { [table: string]: string[] },
  columnMappings: Record<string, Record<string, string>>,
  tableMappings: Record<string, string>,
  engine: MigrationEngine,
): Promise<ModeloIntermediario> {
  const mongoUrl = `mongodb://${config.user ? config.user + ":" + config.password + "@" : ""}${config.host}:${config.port}/${config.database}${config.authSource ? `?authSource=${config.authSource}` : ""}`;

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const mongoDb = client.db(config.database);

    const adapter = new MongoAdapter(mongoDb);
    const data = await engine.createModel(
      adapter,
      tables,
      columns,
      columnMappings,
      tableMappings,
    );

    await client.close();
    return data;
  } catch (error) {
    await client.close();
    throw error;
  }
}

function transformForDestination(
  destinationType: DatabaseType,
  algorithm: number,
  data: ModeloIntermediario,
): ModeloIntermediario {
  if (destinationType === "postgresql") {
    const adapter = new PostgresAdapter(null as any);
    return adapter.transformData(data, algorithm);
  }

  if (destinationType === "mongodb") {
    const adapter = new MongoAdapter(null as any);
    return adapter.transformData(data, algorithm);
  }

  throw new Error("Tipo de banco de destino não suportado");
}
