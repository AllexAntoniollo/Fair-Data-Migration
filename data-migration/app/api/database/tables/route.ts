import { NextRequest, NextResponse } from "next/server";
import { PostgresAdapter } from "@/adapters/postgres";
import { MongoAdapter } from "@/adapters/mongo";
import pgPromise from "pg-promise";
import { MongoClient } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const dbType = config.type as string;

    let tables: string[] = [];

    if (dbType === "postgresql") {
      tables = await listTablesPostgres(config);
    } else if (dbType === "mongodb") {
      tables = await listTablesMongoDB(config);
    }

    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error("Erro ao listar tabelas:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

async function listTablesPostgres(config: any): Promise<string[]> {
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
    const tables = await adapter.listTables("public");

    await pgp.end();
    return tables;
  } catch (error) {
    await pgp.end();
    throw error;
  }
}

async function listTablesMongoDB(config: any): Promise<string[]> {
  const mongoUrl = `mongodb://${config.user ? config.user + ":" + config.password + "@" : ""}${config.host}:${config.port}/${config.database}${config.authSource ? `?authSource=${config.authSource}` : ""}`;

  const mongoClient = new MongoClient(mongoUrl);

  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db(config.database);
    const adapter = new MongoAdapter(mongoDb);
    await adapter.connect();
    const tables = await adapter.listTables(config.database);
    await mongoClient.close();
    return tables;
  } catch (error) {
    await mongoClient.close();
    throw error;
  }
}
