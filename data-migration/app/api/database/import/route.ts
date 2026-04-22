import { NextRequest, NextResponse } from "next/server";
import { PostgresAdapter } from "@/adapters/postgres";
import { MongoAdapter } from "@/adapters/mongo";
import { MigrationEngine } from "@/core/MigrationEngine";
import pgPromise from "pg-promise";
import { MongoClient } from "mongodb";
import { ModeloIntermediario } from "@/core/types";
import { Neo4JAdapter } from "@/adapters/neo4j";
import neo4j from "neo4j-driver";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, data } = body;

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum dado para importar" },
        { status: 400 },
      );
    }

    const { type, schema = "public", ...connectionConfig } = config;
    const engine = new MigrationEngine();

    if (type === "postgresql") {
      await importPostgres(connectionConfig, data, engine);
    } else if (type === "mongodb") {
      await importMongoDB(connectionConfig, data, engine);
    } else if (type === "neo4j") {
      await importNeo4J(connectionConfig, data, engine);
    } else {
      return NextResponse.json(
        { success: false, error: "Tipo de banco de dados não suportado" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dados importados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao importar dados:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

async function importPostgres(
  config: any,
  data: ModeloIntermediario,
  engine: MigrationEngine,
): Promise<void> {
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
    await adapter.connect();

    await engine.importData(adapter, data);
    await pgp.end();
  } catch (error) {
    await pgp.end();
    throw error;
  }
}

async function importNeo4J(
  config: any,
  data: ModeloIntermediario,
  engine: MigrationEngine,
): Promise<void> {
  const uri = `bolt://${config.host}:${config.port}`;

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(config.user || "neo4j", config.password || ""),
    {
      encrypted: config.ssl || false,
    },
  );

  try {
    const adapter = new Neo4JAdapter(driver, config.database || "neo4j");
    await engine.importData(adapter, data);
    await driver.close();
  } catch (error) {
    await driver.close();
    throw error;
  }
}
async function importMongoDB(
  config: any,
  data: ModeloIntermediario,
  engine: MigrationEngine,
): Promise<void> {
  const connectionString = `mongodb://${config.host}:${config.port}`;
  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const mongoDb = client.db(config.database);

    const adapter = new MongoAdapter(mongoDb);

    await engine.importData(adapter, data);
    await client.close();
  } catch (error) {
    await client.close();
    throw error;
  }
}
