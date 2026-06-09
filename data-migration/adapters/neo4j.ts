import neo4j, { Driver, Session } from "neo4j-driver";
import {
  AlgorithmInfo,
  DatabaseAdapter,
  GraphenedUserInput,
  GraphMapping,
  ModeloIntermediario,
  TableSchema,
} from "../core/types";

export class Neo4JAdapter implements DatabaseAdapter {
  private session?: Session;

  constructor(
    private driver: Driver,
    private database: string = "neo4j",
  ) {
    if (this.driver) {
      this.session = this.driver.session({
        database: this.database,
      });
    }
  }

  async connect() {
    if (!this.session) {
      throw new Error("Neo4j driver não inicializado");
    }

    try {
      await this.session.run("RETURN 1");
    } catch (error) {
      console.error("Erro ao conectar no Neo4j:", error);
      throw error;
    }
  }

  async read(label: string, params: string) {
    if (!this.session) {
      throw new Error("Neo4j driver não inicializado");
    }

    const result = await this.session.run(`MATCH (n:${label}) RETURN n`);
    return result.records.map((r: any) => r.get("n").properties);
  }

  async listTables(): Promise<string[]> {
    if (!this.session) {
      throw new Error("Neo4j driver não inicializado");
    }

    const result = await this.session.run(`
      CALL db.labels()
    `);

    return result.records.map((r) => r.get("label"));
  }

  async createTable(label: string): Promise<void> {
    return;
  }

  async write(label: string, data: any[]) {
    const modelo = data[0] as ModeloIntermediario;
    if (!this.session) {
      throw new Error("Neo4j driver não inicializado");
    }
    if (!modelo.mapping) {
      throw new Error("Mapping not found in ModeloIntermediario");
    }

    // Create map from original table to node label (handling unification)
    const nodeLabelMap = new Map<string, string>();
    for (const t in modelo.mapping) {
      const map = modelo.mapping[t];
      if (map.type === "node") {
        nodeLabelMap.set(t, t);
        for (const u of map.unifiedTables || []) {
          nodeLabelMap.set(u, t);
        }
      }
    }

    // Insert nodes (BATCH)
    for (const table in modelo.mapping) {
      const map = modelo.mapping[table];

      if (map.type === "node") {
        const nodeLabel = table;

        const allTables = [table, ...(map.unifiedTables || [])];

        const allData = allTables.flatMap((t) => modelo.data[t] || []);

        const pk = modelo.schema[table].primaryKey;

        const BATCH_SIZE = 1000;

        for (let i = 0; i < allData.length; i += BATCH_SIZE) {
          const batch = allData.slice(i, i + BATCH_SIZE);

          await this.session.run(
            `
        UNWIND $rows AS row

        MERGE (n:${nodeLabel} {${pk}: row.${pk}})
        SET n += row
        `,
            {
              rows: batch,
            },
          );

          console.log(`[NODE BATCH] ${nodeLabel} ${i}/${allData.length}`);
        }
      }
    }

    // Insert relationships from node edges
    for (const table in modelo.mapping) {
      const map = modelo.mapping[table];

      if (map.type === "node") {
        const nodeLabel = table;

        for (const edge of map.edges || []) {
          const targetLabel =
            nodeLabelMap.get(edge.targetTable) || edge.targetTable;
          const tableData = modelo.data[table] || [];
          const pk = modelo.schema[table].primaryKey;
          const targetPk = modelo.schema[edge.targetTable].primaryKey;

          const relType = `${table}_${edge.field}`
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, "_")
            .replace(/^_|_$/g, "");

          // 1. Coleta todos os pares válidos de uma vez
          const pairs = tableData
            .filter((row) => row[edge.field] != null)
            .map((row) => ({ sourceId: row[pk], targetId: row[edge.field] }));

          if (pairs.length === 0) continue;

          console.log(
            `[GRAPHENED][REL] ${table} --(${relType})-> ${edge.targetTable} | ${pairs.length} rels`,
          );

          // 2. Dispara em lotes para não estourar memória/tx no Neo4j
          const BATCH_SIZE = 1000;
          for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
            const batch = pairs.slice(i, i + BATCH_SIZE);

            await this.session.run(
              `
          UNWIND $batch AS pair
          MATCH (n:${nodeLabel} {${pk}: pair.sourceId})
          MATCH (m:${targetLabel} {${targetPk}: pair.targetId})
          MERGE (n)-[:${relType}]->(m)
          `,
              { batch },
            );
          }
        }
      }
    }
  }

  async listColumns(label: string): Promise<string[]> {
    if (!this.session) {
      throw new Error("Neo4j driver não inicializado");
    }

    const result = await this.session.run(
      `
      MATCH (n:${label})
      RETURN keys(n) AS keys
      LIMIT 1
      `,
    );

    if (result.records.length === 0) return [];

    return result.records[0].get("keys");
  }

  transformData(
    data: ModeloIntermediario,
    algorithm: number,
  ): ModeloIntermediario {
    switch (algorithm) {
      case 1:
        return this.algorithm1(data);
      default:
        throw new Error("Algoritmo inválido");
    }
  }
  private hasCycle(unifiedMap: any, from: any, to: any) {
    let current = to;

    while (unifiedMap.has(current)) {
      current = unifiedMap.get(current);
      if (current === from) return true;
    }

    return false;
  }
  private algorithm1(
    data: ModeloIntermediario,
    userInput: GraphenedUserInput = {},
  ): ModeloIntermediario {
    const result: ModeloIntermediario = {
      ...data,
      mapping: {},
    };

    const { schema } = data;

    const MAX_NKEY = userInput.MAX_NKEY ?? 5;
    const MAX_UATT = userInput.MAX_UATT ?? 100;
    const NJTab = new Set(userInput.NJTab ?? []);
    const JTab = new Set(userInput.JTab ?? []);
    const NUTab = new Set(userInput.NUTab ?? []);

    const joinTables = new Set<string>();
    const unifiedMap = new Map<string, string>();

    for (const t in schema) {
      const tableSchema = schema[t];

      const nbFK = tableSchema.foreignKeys.length;

      const nbReft = Object.values(schema).filter((s) =>
        s.foreignKeys.some((fk) => fk.references.table === t),
      ).length;

      const numNonPkColumns = tableSchema.columns.filter(
        (col) => col !== tableSchema.primaryKey,
      ).length;

      const isStructurallyJoin = nbFK === 2 && nbReft === 0;
      const meetsAttributeThreshold = numNonPkColumns <= MAX_NKEY;

      if (
        isStructurallyJoin &&
        (meetsAttributeThreshold || JTab.has(t)) &&
        !NJTab.has(t)
      ) {
        joinTables.add(t);
      }
    }

    // -----------------------------------------------------------
    // 2. Unificar Tabelas (Algorithm 3)
    // -----------------------------------------------------------

    for (const table in schema) {
      if (joinTables.has(table)) continue;
      if (NUTab.has(table)) continue;

      const fks = schema[table].foreignKeys;

      for (const fk of fks) {
        const fkTable = fk.references.table;

        if (
          table !== fkTable &&
          !joinTables.has(fkTable) &&
          !unifiedMap.has(fkTable) &&
          fk.isUnique &&
          !this.hasCycle(unifiedMap, table, fkTable)
        ) {
          const currSize = schema[table].columns.length;
          const fkTableSize = schema[fkTable].columns.length;

          if (currSize + fkTableSize <= MAX_UATT) {
            unifiedMap.set(fkTable, table);
          }
        }
      }
    }

    // -----------------------------------------------------------
    // 3. Definir Mapping e Tratar Arestas
    // -----------------------------------------------------------

    for (const table in schema) {
      if (unifiedMap.has(table)) continue;

      const isJoin = joinTables.has(table);

      result.mapping![table] = {
        type: isJoin ? "edge" : "node",
        isJoinTable: isJoin,
        unifiedTables: [],
        edges: [],
      };
    }

    // Preencher a lista de tabelas unificadas dentro do nó pai
    for (const [absorbed, parent] of unifiedMap.entries()) {
      if (result.mapping![parent]) {
        result.mapping![parent].unifiedTables?.push(absorbed);
      }
    }

    // Mapear Foreign Keys para Edges (Passo 5 do artigo)
    for (const table in schema) {
      // Join Tables no Graphened viram a própria aresta (Passo 6),
      // por isso não processamos suas FKs aqui como arestas de saída.
      if (joinTables.has(table)) continue;

      const sourceTable = unifiedMap.get(table) || table;
      const fks = schema[table].foreignKeys;

      for (const fk of fks) {
        const targetTable =
          unifiedMap.get(fk.references.table) || fk.references.table;

        // Se a tabela de origem e destino forem a mesma após a unificação,
        // a FK virou uma propriedade interna e não gera Edge.
        if (sourceTable !== targetTable) {
          // Adicionamos a aresta no nó "vovô" ou "pai" que restou
          result.mapping![sourceTable]?.edges!.push({
            field: fk.field,
            targetTable: targetTable,
          });
        }
      }
    }

    return result;
  }

  listAlgorithms(): AlgorithmInfo[] {
    return [
      {
        id: 1,
        name: "Graphened",
        description:
          "Abstrair o esquema original em um grafo e aplicar um algoritmo para determinar nós e arestas.",
      },
    ];
  }
}
