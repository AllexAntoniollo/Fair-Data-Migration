import { NextRequest, NextResponse } from "next/server";
import { PostgresAdapter } from "@/adapters/postgres";
import { MongoAdapter } from "@/adapters/mongo";
import pgPromise from "pg-promise";
import { MongoClient } from "mongodb";

export interface ColumnsRequest {
  config: any;
  tables: string[];
}

export interface ColumnsResponse {
  [tableName: string]: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { config, tables }: ColumnsRequest = await request.json();
    const dbType = config.type as string;

    const columnsMap: ColumnsResponse = {};

    if (dbType === "postgresql") {
      for (const table of tables) {
        columnsMap[table] = await getColumnsPostgres(config, table);
      }
    } else if (dbType === "mongodb") {
      for (const collection of tables) {
        columnsMap[collection] = await getColumnsMongoDB(config, collection);
      }
    }

    return NextResponse.json({ success: true, columns: columnsMap });
  } catch (error) {
    console.error("Erro ao listar colunas:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

async function getColumnsPostgres(
  config: any,
  table: string,
): Promise<string[]> {
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

    const columns = await adapter.listColumns(table, "public");

    await pgp.end();
    return columns;
  } catch (error) {
    await pgp.end();
    throw error;
  }
}

async function getColumnsMongoDB(
  config: any,
  collection: string,
): Promise<string[]> {
  const mongoUrl = `mongodb://${config.user ? config.user + ":" + config.password + "@" : ""}${config.host}:${config.port}/${config.database}${config.authSource ? `?authSource=${config.authSource}` : ""}`;

  const mongoClient = new MongoClient(mongoUrl);

  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db(config.database);
    const adapter = new MongoAdapter(mongoDb);
    await adapter.connect();
    const columns = await adapter.listColumns(collection);
    await mongoClient.close();
    return columns;
  } catch (error) {
    await mongoClient.close();
    throw error;
  }
}
