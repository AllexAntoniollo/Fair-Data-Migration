import {
  AlgorithmInfo,
  DatabaseAdapter,
  ModeloIntermediario,
} from "../core/types";
import { Db } from "mongodb";

export class MongoAdapter implements DatabaseAdapter {
  constructor(private db: Db) {}

  async connect() {
    try {
      const result = await this.db.command({ ping: 1 });
    } catch (error) {
      console.error("Erro ao conectar no MongoDB:", error);
      throw error;
    }
  }
  async read(collection: string) {
    const res = await this.db.collection(collection).find().toArray();

    return res;
  }

  async write(collection: string, data: any[]) {
    const exists = await this.db
      .listCollections({ name: collection })
      .hasNext();

    if (!exists) {
      await this.db.createCollection(collection);
    }

    if (data.length > 0) {
      await this.db.collection(collection).insertMany(data);
    }
  }
  async listTables(schemaName: string): Promise<string[]> {
    const db = this.db.client.db(schemaName);
    const collections = await db.listCollections().toArray();
    return collections.map((c) => c.name);
  }

  async createTable(tableName: string): Promise<void> {
    // For MongoDB, create collection
    await this.db.createCollection(tableName);
  }
  async listColumns(collection: string): Promise<string[]> {
    const docs = await this.db
      .collection(collection)
      .find()
      .limit(100)
      .toArray();

    const fields = new Set<string>();

    docs.forEach((doc) => {
      Object.keys(doc).forEach((key) => fields.add(key));
    });

    return Array.from(fields);
  }

  transformData(
    data: ModeloIntermediario,
    algorithm: number,
  ): ModeloIntermediario {
    switch (algorithm) {
      case 1:
        return this.algorithm1(data);

      case 2:
        return this.algorithm2(data);

      default:
        throw new Error("Algoritmo inválido");
    }
  }

  private algorithm1(data: ModeloIntermediario): ModeloIntermediario {
    return data;
  }

  private algorithm2(
    data: ModeloIntermediario,
    MX_ATT: number = 2,
  ): ModeloIntermediario {
    const { data: tables, schema } = data;
    const transformed: ModeloIntermediario = { data: {}, schema };

    const aggregatedTables = new Set<string>();
    const JTList = new Set<string>();

    const sortedTableNames = Object.keys(tables).sort(
      (a, b) =>
        (schema[b].foreignKeys?.length || 0) -
        (schema[a].foreignKeys?.length || 0),
    );

    for (const t of sortedTableNames) {
      const tableSchema = schema[t];
      const nbFK = tableSchema.foreignKeys.length;
      const nbReft = Object.values(schema).filter((s) =>
        s.foreignKeys.some((fk) => fk.references.table === t),
      ).length;
      const pk = tableSchema.primaryKey;
      const sample = tables[t]?.[0] || {};
      const nbCols = Object.keys(sample).length - (pk ? 1 : 0) - nbFK;

      if (nbReft === 0 && nbFK === 2 && nbCols < MX_ATT) {
        JTList.add(t);
      }
    }

    for (const table of sortedTableNames) {
      if (JTList.has(table) || aggregatedTables.has(table)) {
        continue;
      }

      const tableSchema = schema[table];
      const pk = tableSchema.primaryKey;
      transformed.data[table] = [];

      for (const r of tables[table]) {
        const D: any = { ...r };

        // Bloco 1: join tables
        for (const jtName of JTList) {
          const jtSchema = schema[jtName];
          const fkToCurrent = jtSchema.foreignKeys.find(
            (f) => f.references.table === table,
          );
          const fkToOther = jtSchema.foreignKeys.find(
            (f) => f.references.table !== table,
          );

          if (fkToCurrent && fkToOther) {
            const matches = tables[jtName].filter(
              (joinRow) => joinRow[fkToCurrent.field] === r[pk],
            );

            if (matches.length > 0) {
              const otherTable = fkToOther.references.table;
              const otherPK = schema[otherTable].primaryKey;

              const relatedData = matches
                .map((m) =>
                  tables[otherTable].find(
                    (row) => row[otherPK] === m[fkToOther.field],
                  ),
                )
                .filter(Boolean);

              if (relatedData.length > 0) {
                D[otherTable] = relatedData;
                aggregatedTables.add(jtName);
                aggregatedTables.add(otherTable);
              }
            }
          }
        }

        // Bloco 2: tabelas filhas com 1 FK apontando para a tabela atual (pai)
        for (const [trName, trSchema] of Object.entries(schema)) {
          if (trSchema.foreignKeys.length !== 1) continue;
          const fk = trSchema.foreignKeys[0];
          if (fk.references.table !== table) continue;
          if (transformed.data[trName] !== undefined) continue;

          const relatedRows = tables[trName].filter(
            (childRow) => childRow[fk.field] === r[pk],
          );

          if (relatedRows.length > 0) {
            D[trName] = relatedRows;
            aggregatedTables.add(trName);
          }
        }

        // Bloco 3 (opção B): FKs diretas da tabela atual para tabelas "lookup"
        // Ex: film.language_id → language. Embutir o registro pai como subdocumento.
        for (const fk of tableSchema.foreignKeys) {
          const parentTable = fk.references.table;

          // Só embutir se a tabela pai não tem FKs próprias (é uma tabela lookup/dimensão)
          // e não foi marcada como coleção independente ainda
          const parentSchema = schema[parentTable];
          if (!parentSchema) continue;
          if (parentSchema.foreignKeys.length > 0) continue;
          if (JTList.has(parentTable)) continue;

          const parentPK = parentSchema.primaryKey;
          const parentRow = tables[parentTable]?.find(
            (row) => row[parentPK] === r[fk.field],
          );

          if (parentRow) {
            D[parentTable] = parentRow;
            aggregatedTables.add(parentTable);
          }
        }

        transformed.data[table].push(D);
      }
    }

    return transformed;
  }

  listAlgorithms(): AlgorithmInfo[] {
    return [
      {
        id: 1,
        name: "Identidade",
        description: "Não altera os dados",
      },
      {
        id: 2,
        name: "Transformação Embedded",
        description: "Embebede tabelas relacionadas em um único documento",
      },
    ];
  }
}
