import { NextRequest, NextResponse } from "next/server";
import { PostgresAdapter } from "@/adapters/postgres";
import { MongoAdapter } from "@/adapters/mongo";
import pgPromise from "pg-promise";
import { MongoClient } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const dbType = config.type as string;

    let algorithms: any[] = [];

    if (dbType === "postgresql") {
      algorithms = await listAlgorithmsPostgres(config);
    } else if (dbType === "mongodb") {
      algorithms = await listAlgorithmsMongoDB(config);
    }

    return NextResponse.json({ success: true, algorithms });
  } catch (error) {
    console.error("Erro ao listar algoritmos:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

async function listAlgorithmsPostgres(config: any): Promise<any[]> {
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
    const algorithms = adapter.listAlgorithms();

    await pgp.end();
    return algorithms;
  } catch (error) {
    await pgp.end();
    throw error;
  }
}

async function listAlgorithmsMongoDB(config: any): Promise<any[]> {
  const connectionString = `mongodb://${config.host}:${config.port}/${config.database}`;

  const client = new MongoClient(connectionString);

  try {
    await client.connect();

    const adapter = new MongoAdapter(client.db(config.database));
    await adapter.connect();

    const algorithms = adapter.listAlgorithms();

    await client.close();
    return algorithms;
  } catch (error) {
    await client.close();
    throw error;
  }
}
