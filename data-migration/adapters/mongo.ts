import { DatabaseAdapter } from "../core/types";
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
}
