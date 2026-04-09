import {
  AlgorithmInfo,
  DatabaseAdapter,
  ModeloIntermediario,
} from "../core/types";
import { Db } from "mongodb";

export class MongoAdapter implements DatabaseAdapter {
  constructor(private db: Db) {}

  async connect() {}

  async read(collection: string) {
    return await this.db.collection(collection).find().toArray();
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

  async disconnect() {}
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
    // Identidade (não altera nada)
    return data;
  }

  private algorithm2(data: ModeloIntermediario): ModeloIntermediario {
    const { data: tables, schema } = data;

    const transformed: ModeloIntermediario = {
      data: {},
      schema,
    };

    const aggregated = new Set<string>();

    // 🔁 mapa reverso: quem referencia quem
    const referencedBy: Record<string, string[]> = {};

    for (const [table, tableSchema] of Object.entries(schema)) {
      for (const fk of tableSchema.foreignKeys) {
        const parent = fk.references.table;

        if (!referencedBy[parent]) {
          referencedBy[parent] = [];
        }

        referencedBy[parent].push(table);
      }
    }

    // 🔍 detectar join tables (N:N)
    const isJoinTable = (table: string) => {
      return schema[table].foreignKeys.length === 2;
    };

    for (const [table, records] of Object.entries(tables)) {
      if (aggregated.has(table)) continue;

      transformed.data[table] = [];

      for (const record of records) {
        const doc: any = { ...record };

        const children = referencedBy[table] || [];

        for (const childTable of children) {
          if (aggregated.has(childTable)) continue;

          const childSchema = schema[childTable];
          const childRecords = tables[childTable];

          // 🧩 CASO 1: tabela normal (1:N)
          if (childSchema.foreignKeys.length === 1) {
            const fk = childSchema.foreignKeys[0];

            const embedded = childRecords.filter(
              (r) => r[fk.field] === record[schema[table].primaryKey],
            );

            if (embedded.length > 0) {
              doc[childTable] = embedded;
              aggregated.add(childTable);
            }
          }

          // 🔥 CASO 2: join table (N:N)
          else if (isJoinTable(childTable)) {
            const [fk1, fk2] = childSchema.foreignKeys;

            // identificar qual FK aponta pra tabela atual
            const fkToParent = fk1.references.table === table ? fk1 : fk2;

            const fkToOther = fk1.references.table === table ? fk2 : fk1;

            // pegar registros da join table relacionados
            const joinRecords = childRecords.filter(
              (r) => r[fkToParent.field] === record[schema[table].primaryKey],
            );

            if (joinRecords.length > 0) {
              doc[childTable] = joinRecords.map((jr) => {
                const relatedTable = fkToOther.references.table;
                const relatedPK = schema[relatedTable].primaryKey;

                const related = tables[relatedTable].find(
                  (r) => r[relatedPK] === jr[fkToOther.field],
                );

                return {
                  ...jr,
                  [relatedTable]: related || null,
                };
              });

              aggregated.add(childTable);
            }
          }
        }

        transformed.data[table].push(doc);
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
