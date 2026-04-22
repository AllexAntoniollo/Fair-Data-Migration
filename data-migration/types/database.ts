// Tipos base para todo banco de dados
export type DatabaseType = "postgresql" | "mongodb" | "neo4j";

export interface BaseDatabaseConfig {
  type: DatabaseType;
  name: string;
}

// PostgreSQL Configuration
export interface PostgreSQLConfig extends BaseDatabaseConfig {
  type: "postgresql";
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

// MongoDB Configuration
export interface MongoDBConfig extends BaseDatabaseConfig {
  type: "mongodb";
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  authSource?: string;
  ssl?: boolean;
}

// Neo4j Configuration
export interface Neo4jConfig extends BaseDatabaseConfig {
  type: "neo4j";
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  ssl?: boolean;
}

export type DatabaseConfig = PostgreSQLConfig | MongoDBConfig | Neo4jConfig;

export interface MigrationConfig {
  source: DatabaseConfig;
  destination: DatabaseConfig;
}

export const DATABASE_METADATA: Record<
  DatabaseType,
  {
    label: string;
    icon: string;
    fields: {
      required: string[];
      optional: string[];
    };
  }
> = {
  postgresql: {
    label: "PostgreSQL",
    icon: "🐘",
    fields: {
      required: ["host", "port", "user", "password", "database"],
      optional: ["ssl"],
    },
  },
  mongodb: {
    label: "MongoDB",
    icon: "🍃",
    fields: {
      required: ["host", "port", "database"],
      optional: ["user", "password", "authSource", "ssl"],
    },
  },
  neo4j: {
    label: "Neo4j",
    icon: "🧠",
    fields: {
      required: ["host", "port", "database"],
      optional: ["user", "password", "authSource", "ssl"],
    },
  },
};
