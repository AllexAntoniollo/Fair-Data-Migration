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

        let usedJoin = false;
        for (const jtName of JTList) {
          if (aggregatedTables.has(jtName)) {
            continue;
          }
          const jtSchema = schema[jtName];
          const fkToCurrent = jtSchema.foreignKeys.find(
            (f) => f.references.table === table,
          );
          const fkToOther = jtSchema.foreignKeys.find(
            (f) => f.references.table !== table,
          );

          if (fkToCurrent && fkToOther) {
            const matches = [];

            for (const joinRow of tables[jtName]) {
              const joinValue = joinRow[fkToCurrent.field];
              const currentId = r[pk];

              if (joinValue === currentId) {
                matches.push(joinRow);
              }
            }

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

                usedJoin = true;
              }
            }
          }
        }

        if (usedJoin) {
          transformed.data[table].push(D);
          continue;
        }

        for (const [trName, trSchema] of Object.entries(schema)) {
          const nbFK = trSchema.foreignKeys.length;

          if (nbFK === 1) {
            const fk = trSchema.foreignKeys[0];

            if (fk.references.table === table) {
              const relatedRows = [];

              for (const childRow of tables[trName]) {
                const childForeignKey = childRow[fk.field];
                const parentPrimaryKey = r[pk];

                if (childForeignKey === parentPrimaryKey) {
                  relatedRows.push(childRow);
                }
              }

              if (relatedRows.length > 0) {
                D[trName] = relatedRows;
                aggregatedTables.add(trName);
              }
            }
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
