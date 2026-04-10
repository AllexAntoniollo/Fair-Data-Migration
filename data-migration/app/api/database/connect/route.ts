import { NextRequest, NextResponse } from "next/server";
import { DatabaseConfig } from "@/types/database";
import pgPromise from "pg-promise";
import { MongoClient } from "mongodb";
import { PostgresAdapter } from "@/adapters/postgres";
import { MongoAdapter } from "@/adapters/mongo";

export async function POST(request: NextRequest) {
  try {
    const config: DatabaseConfig = await request.json();

    if (config.type === "postgresql") {
      const pgp = pgPromise();
      const db = pgp({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl || false,
      });

      try {
        const adapter = new PostgresAdapter(db);
        await adapter.connect();
        await db.$pool.end();
        return NextResponse.json({
          success: true,
          message: "Conexão com PostgreSQL estabelecida com sucesso",
        });
      } catch (error) {
        await db.$pool.end();
        throw error;
      }
    } else if (config.type === "mongodb") {
      const uri = `mongodb://${config.user ? config.user + ":" + config.password + "@" : ""}${config.host}:${config.port}/${config.database}${config.authSource ? `?authSource=${config.authSource}` : ""}`;

      const client = new MongoClient(uri, { ssl: config.ssl || false });

      try {
        await client.connect();
        const db = client.db(config.database);
        const adapter = new MongoAdapter(db);
        await adapter.connect();
        await client.close();
        return NextResponse.json({
          success: true,
          message: "Conexão com MongoDB estabelecida com sucesso",
        });
      } catch (error) {
        await client.close();
        throw error;
      }
    }

    return NextResponse.json(
      { success: false, message: "Tipo de banco de dados inválido" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao conectar ao banco de dados: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 },
    );
  }
}
