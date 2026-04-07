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

export const postgresConfigDefaults: Partial<PostgresConfig> = {
  host: "localhost",
  port: 5432,
};

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

// ========== TIPO GUARD ==========
export function isPostgresConfig(
  config: DatabaseConfig,
): config is PostgresConfig {
  return config.type === "postgres";
}

export function isMongodbConfig(
  config: DatabaseConfig,
): config is MongodbConfig {
  return config.type === "mongodb";
}

// ========== VALIDAÇÃO ==========
export function validatePostgresConfig(
  config: Partial<PostgresConfig>,
): config is PostgresConfig {
  return (
    config.type === "postgres" &&
    !!config.host &&
    !!config.port &&
    !!config.database &&
    !!config.user &&
    !!config.password
  );
}

export function validateMongodbConfig(
  config: Partial<MongodbConfig>,
): config is MongodbConfig {
  return config.type === "mongodb" && !!config.url && !!config.database;
}

export function validateDatabaseConfig(
  config: Partial<DatabaseConfig>,
): config is DatabaseConfig {
  if (!config.type) return false;

  if (config.type === "postgres") {
    return validatePostgresConfig(config as Partial<PostgresConfig>);
  } else if (config.type === "mongodb") {
    return validateMongodbConfig(config as Partial<MongodbConfig>);
  }

  return false;
}
