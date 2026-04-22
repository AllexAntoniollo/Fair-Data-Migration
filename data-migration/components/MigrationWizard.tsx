"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import {
  DatabaseType,
  DatabaseConfig,
  MigrationConfig,
} from "@/types/database";
import { DatabaseSelector } from "./DatabaseSelector";
import { ConnectionForm } from "./ConnectionForm";
import { PreviewStep } from "./PreviewStep";
import { TableSelectionStep } from "./TableSelectionStep";
import { ColumnSelectionStep } from "./ColumnSelectionStep";
import { AlgorithmSelectionStep } from "./AlgorithmSelectionStep";
import { MigratingStep } from "./MigratingStep";
import { NavigationButtons } from "./NavigationButtons";

import { ModeloIntermediario } from "@/core/types";
import {
  importDatabase,
  exportDatabase,
  listColumns,
  listTables,
  listAlgorithms,
} from "@/app/services/Web2Service";
import { MigrationEngine } from "@/core/MigrationEngine";
import { MigrationStage, Step, stepTitles } from "./stepTypes";

interface MigrationWizardProps {
  onMigrationConfigReady?: (config: MigrationConfig) => void;
}

export const MigrationWizard: React.FC<MigrationWizardProps> = ({
  onMigrationConfigReady,
}) => {
  const [step, setStep] = useState<Step>("selectSource");
  const [sourceDb, setSourceDb] = useState<DatabaseType | "">("");
  const [destDb, setDestDb] = useState<DatabaseType | "">("");
  const [sourceConfig, setSourceConfig] = useState<DatabaseConfig | null>(null);
  const [destConfig, setDestConfig] = useState<DatabaseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<Record<string, string[]>>(
    {},
  );
  const [selectedColumns, setSelectedColumns] = useState<
    Record<string, string[]>
  >({});
  const [columnMappings, setColumnMappings] = useState<
    Record<string, Record<string, string>>
  >({});
  const [tableMappings, setTableMappings] = useState<Record<string, string>>(
    {},
  );
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<number>(1);
  const [migrationStage, setMigrationStage] = useState<MigrationStage>("idle");
  const [exportedData, setExportedData] = useState<ModeloIntermediario | null>(
    null,
  );

  const [downloadFileName, setDownloadFileName] = useState<string>(
    "modelo_intermediario",
  );
  const [availableAlgorithms, setAvailableAlgorithms] = useState<any[]>([]);

  const handleSourceDbSelect = (db: DatabaseType) => {
    setSourceDb(db);
    setStep("configSource");
  };

  const handleSourceConfigSubmit = async (config: DatabaseConfig) => {
    setIsLoading(true);
    try {
      // Teste a conexão com a rota de API
      const response = await fetch("/api/database/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      if (result.success) {
        setSourceConfig(config);
        setStep("selectDest");
      } else {
        alert(`Erro ao conectar ao banco de origem: ${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      alert(
        `Erro ao conectar ao banco de origem: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestDbSelect = (db: DatabaseType) => {
    setDestDb(db);
    setStep("configDest");
  };

  const handleDestConfigSubmit = async (config: DatabaseConfig) => {
    setIsLoading(true);
    try {
      // Teste a conexão com a rota de API
      const response = await fetch("/api/database/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      if (result.success) {
        setDestConfig(config);
        const algorithms = await listAlgorithms(config);
        setAvailableAlgorithms(algorithms);
        setSelectedAlgorithm(algorithms[0]?.id ?? 1);
        setStep("preview");
      } else {
        alert(`Erro ao conectar ao banco de destino: ${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      alert(
        `Erro ao conectar ao banco de destino: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSelectTables = async () => {
    if (!sourceConfig) return;

    setIsLoading(true);
    try {
      // Listar as tabelas do banco de ORIGEM (sourceConfig)
      const tables = await listTables(sourceConfig);
      setAvailableTables(tables);
      setSelectedTables(tables); // Pré-selecionar todas por padrão
      setStep("selectTables");
    } catch (error) {
      console.error("Erro ao listar tabelas:", error);
      alert(`Erro ao listar tabelas: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadModel = () => {
    if (!exportedData) return;
    const engine = new MigrationEngine();
    engine.downloadModeloIntermediario(
      exportedData,
      `${downloadFileName}.json`,
    );
  };
  const handleContinueMigration = async () => {
    if (!exportedData || !destConfig) return;

    setMigrationStage("importing");

    try {
      // Importar dados para o banco de destino
      await importDatabase(destConfig, exportedData);

      // Migração concluída com sucesso
      setMigrationStage("done");

      if (onMigrationConfigReady && sourceConfig && destConfig) {
        onMigrationConfigReady({
          source: sourceConfig,
          destination: destConfig,
          selectedTables,
          selectedColumns,
          columnMappings,
          tableMappings,
          exportedData: exportedData,
        } as any);
      }
    } catch (error) {
      console.error("Erro na importação:", error);
      alert(`Erro na importação: ${(error as Error).message}`);
      setMigrationStage("exported");
    }
  };

  const handleReset = () => {
    setStep("selectSource");
    setSourceDb("");
    setDestDb("");
    setSourceConfig(null);
    setDestConfig(null);
    setAvailableTables([]);
    setSelectedTables([]);
    setTableColumns({});
    setSelectedColumns({});
    setColumnMappings({});
    setTableMappings({});
    setSelectedAlgorithm(1);
    setDownloadFileName("modelo_intermediario");
  };

  const toggleTableSelection = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table],
    );
  };

  const toggleColumnSelection = (table: string, column: string) => {
    setSelectedColumns((prev) => {
      const tableColumns = prev[table] || [];
      return {
        ...prev,
        [table]: tableColumns.includes(column)
          ? tableColumns.filter((c) => c !== column)
          : [...tableColumns, column],
      };
    });
  };

  const fetchTableColumns = async () => {
    if (selectedTables.length === 0 || !sourceConfig) return;

    setIsLoading(true);
    try {
      const columns = await listColumns(sourceConfig, selectedTables);

      // Setar colunas disponíveis
      setTableColumns(columns);

      // Pré-selecionar todas as colunas
      const allColumns: Record<string, string[]> = {};
      const mapping: Record<string, Record<string, string>> = {};
      const tableMapping: Record<string, string> = {};
      selectedTables.forEach((table) => {
        allColumns[table] = columns[table] || [];
        // Inicializar mapeamento com nomes iguais
        mapping[table] = {};
        tableMapping[table] = table;
        (columns[table] || []).forEach((col: string) => {
          mapping[table][col] = col;
        });
      });
      setSelectedColumns(allColumns);
      setColumnMappings(mapping);
      setTableMappings(tableMapping);

      setStep("selectColumns");
    } catch (error) {
      console.error("Erro ao buscar colunas:", error);
      alert(`Erro ao buscar colunas: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateColumnMapping = (
    table: string,
    sourceColumn: string,
    destColumn: string,
  ) => {
    setColumnMappings((prev) => ({
      ...prev,
      [table]: {
        ...prev[table],
        [sourceColumn]: destColumn,
      },
    }));
  };

  const updateTableMapping = (table: string, destTable: string) => {
    setTableMappings((prev) => ({
      ...prev,
      [table]: destTable,
    }));
  };

  const startMigration = async () => {
    if (!sourceConfig) return;

    setStep("migrating");
    setMigrationStage("exporting");

    try {
      const exportData = await exportDatabase(
        sourceConfig,
        selectedTables,
        selectedColumns,
        columnMappings,
        tableMappings,
        destDb,
        selectedAlgorithm,
      );
      setExportedData(exportData);
      setMigrationStage("exported");
    } catch (error) {
      console.error("Erro na migração:", error);
      alert(`Erro na migração: ${(error as Error).message}`);
      setStep("selectColumns");
      setMigrationStage("idle");
    }
  };

  const progressSteps: Step[] = [
    "selectSource",
    "configSource",
    "selectDest",
    "configDest",
    "preview",
    "selectTables",
    "selectColumns",
    "selectAlgorithm",
    "migrating",
  ];

  const currentStepTitle =
    step === "migrating"
      ? migrationStage === "exporting"
        ? "Exportando dados..."
        : migrationStage === "exported"
          ? "Aguardando download do modelo"
          : migrationStage === "importing"
            ? "Importando dados..."
            : "Migrando Dados..."
      : stepTitles[step];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {progressSteps.map((s, idx) => {
            const isActive = step === s;
            const isCompleted = progressSteps.indexOf(step) > idx;
            return (
              <React.Fragment key={s}>
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-linear-to-br from-blue-600 to-cyan-500 text-white shadow-lg border border-white"
                      : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isCompleted ? <CheckCircle size={20} /> : idx + 1}
                </motion.div>
                {idx < progressSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full ${
                      isCompleted ? "bg-green-600" : "bg-slate-700"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <h2 className="text-2xl font-bold text-white">{currentStepTitle}</h2>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Select Source Database */}
          {step === "selectSource" && (
            <DatabaseSelector
              label="Banco de Origem"
              selected={sourceDb}
              onSelect={handleSourceDbSelect}
            />
          )}

          {/* Step 2: Configure Source */}
          {step === "configSource" && sourceDb && (
            <ConnectionForm
              databaseType={sourceDb}
              onSubmit={handleSourceConfigSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Step 3: Select Destination Database */}
          {step === "selectDest" && (
            <DatabaseSelector
              label="Banco de Destino"
              selected={destDb}
              onSelect={handleDestDbSelect}
            />
          )}

          {/* Step 4: Configure Destination */}
          {step === "configDest" && destDb && (
            <ConnectionForm
              databaseType={destDb}
              onSubmit={handleDestConfigSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Step 5: Preview */}
          {step === "preview" && sourceConfig && destConfig && (
            <PreviewStep
              sourceConfig={sourceConfig}
              destConfig={destConfig}
              isLoading={isLoading}
              onBack={() => setStep("configDest")}
              onNext={handleGoToSelectTables}
            />
          )}

          {/* Step 6: Select Tables */}
          {step === "selectTables" && (
            <TableSelectionStep
              availableTables={availableTables}
              selectedTables={selectedTables}
              isLoading={isLoading}
              onToggleTable={toggleTableSelection}
              onBack={() => setStep("preview")}
              onNext={fetchTableColumns}
            />
          )}

          {/* Step 7: Select Columns */}
          {step === "selectColumns" && Object.keys(tableColumns).length > 0 && (
            <ColumnSelectionStep
              selectedTables={selectedTables}
              tableColumns={tableColumns}
              selectedColumns={selectedColumns}
              columnMappings={columnMappings}
              tableMappings={tableMappings}
              isLoading={isLoading}
              onToggleColumn={toggleColumnSelection}
              onUpdateColumnMapping={updateColumnMapping}
              onUpdateTableMapping={updateTableMapping}
              onBack={() => setStep("selectTables")}
              onNext={() => setStep("selectAlgorithm")}
            />
          )}

          {/* Step 8: Select Algorithm */}
          {step === "selectAlgorithm" && (
            <AlgorithmSelectionStep
              destDb={destDb}
              algorithmOptions={availableAlgorithms}
              selectedAlgorithm={selectedAlgorithm}
              isLoading={isLoading}
              onSelectAlgorithm={setSelectedAlgorithm}
              onBack={() => setStep("selectColumns")}
              onStartMigration={startMigration}
            />
          )}
          {step === "migrating" && (
            <MigratingStep
              migrationStage={migrationStage}
              exportedData={exportedData}
              downloadFileName={downloadFileName}
              onChangeFileName={setDownloadFileName}
              onDownload={handleDownloadModel}
              onContinue={handleContinueMigration}
              onReset={handleReset}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <NavigationButtons
        step={step}
        onBack={() => {
          if (step === "configSource") setStep("selectSource");
          if (step === "selectDest") {
            setSourceConfig(null);
            setStep("selectSource");
          }
          if (step === "configDest") setStep("selectDest");
          if (step === "migrating") {
            setMigrationStage("idle");
            setStep("selectColumns");
          }
        }}
      />
    </div>
  );
};
