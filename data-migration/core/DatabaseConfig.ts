/**
 * Tipos de configuração para cada banco de dados
 */

export type DatabaseType = "postgres" | "mongodb";

// ========== POSTGRESQL ==========
export interface PostgresConfig {
  type: "postgres";
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// ========== MONGODB ==========
export interface MongodbConfig {
  type: "mongodb";
  url: string;
  database: string;
}

export const mongodbConfigDefaults: Partial<MongodbConfig> = {
  url: "mongodb://localhost:27017",
};

// ========== UNION TYPE ==========
export type DatabaseConfig = PostgresConfig | MongodbConfig;
