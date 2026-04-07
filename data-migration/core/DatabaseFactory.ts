import pgPromise, { IDatabase } from "pg-promise";
import { MongoClient, Db } from "mongodb";
import { DatabaseAdapter } from "./types";
import { PostgresAdapter } from "../adapters/postgres";
import { MongoAdapter } from "../adapters/mongo";
import {
  DatabaseConfig,
  PostgresConfig,
  MongodbConfig,
  isPostgresConfig,
  isMongodbConfig,
} from "./DatabaseConfig";

/**
 * Factory para criar adapters de banco de dados com configurações específicas
 */
export class DatabaseFactory {
  private static pgInstances: Map<string, IDatabase<any>> = new Map();
  private static mongoInstances: Map<string, { client: MongoClient; db: Db }> =
    new Map();

  /**
   * Cria um adapter PostgreSQL com configuração
   */
  static async createPostgresAdapter(
    config: PostgresConfig,
  ): Promise<PostgresAdapter> {
    const pgp = pgPromise();
    const pgDb = pgp(config);

    // Teste de conexão
    try {
      await pgDb.one("SELECT 1");
      console.log(`✅ PostgreSQL conectado em ${config.host}:${config.port}`);
    } catch (error) {
      throw new Error(`Erro ao conectar no PostgreSQL: ${error}`);
    }

    return new PostgresAdapter(pgDb);
  }

  /**
   * Cria um adapter MongoDB com configuração
   */
  static async createMongodbAdapter(
    config: MongodbConfig,
  ): Promise<MongoAdapter> {
    const mongoClient = new MongoClient(config.url);

    // Teste de conexão
    try {
      await mongoClient.connect();
      const adminDb = mongoClient.db("admin");
      await adminDb.command({ ping: 1 });
      console.log(`✅ MongoDB conectado em ${config.url}`);
    } catch (error) {
      throw new Error(`Erro ao conectar no MongoDB: ${error}`);
    }

    const mongoDb = mongoClient.db(config.database);
    const adapter = new MongoAdapter(mongoDb);

    // Armazenar instância para limpeza posterior
    this.mongoInstances.set(config.database, {
      client: mongoClient,
      db: mongoDb,
    });

    return adapter;
  }

  /**
   * Cria um adapter baseado no tipo de configuração
   */
  static async createAdapter(config: DatabaseConfig): Promise<DatabaseAdapter> {
    if (isPostgresConfig(config)) {
      return this.createPostgresAdapter(config);
    } else if (isMongodbConfig(config)) {
      return this.createMongodbAdapter(config);
    } else {
      throw new Error("Tipo de banco de dados inválido");
    }
  }

  /**
   * Fecha conexões abertas
   */
  static async closeConnections(): Promise<void> {
    // Fechar conexões PostgreSQL
    for (const [_, db] of this.pgInstances) {
      await db.$pool.end();
    }
    this.pgInstances.clear();

    // Fechar conexões MongoDB
    for (const [_, { client }] of this.mongoInstances) {
      await client.close();
    }
    this.mongoInstances.clear();
  }
}
