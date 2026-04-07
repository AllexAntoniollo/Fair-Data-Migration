"use client";

import React from "react";
import { DownloadModelSection } from "./DownloadModelSection";
import { ModeloIntermediario } from "@/core/types";

interface MigrationStatusStepProps {
  migrationStage: "idle" | "exporting" | "exported" | "importing" | "done";
  exportedData: ModeloIntermediario | null;
  downloadFileName: string;
  onChangeFileName: (value: string) => void;
  onDownload: () => void;
  onContinue: () => void;
  onReset: () => void;
}

export const MigrationStatusStep: React.FC<MigrationStatusStepProps> = ({
  migrationStage,
  exportedData,
  downloadFileName,
  onChangeFileName,
  onDownload,
  onContinue,
  onReset,
}) => (
  <div className="bg-slate-900/50 p-8 rounded-lg border border-slate-700 text-center space-y-6">
    <h3 className="text-xl font-semibold text-white">🚀 Executando Migração</h3>

    {(migrationStage === "exporting" || migrationStage === "importing") && (
      <div className="flex justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )}

    <div className="space-y-2">
      {migrationStage === "exporting" && (
        <p className="text-blue-300 font-medium">
          📤 Exportando dados do banco de origem...
        </p>
      )}
      {migrationStage === "exported" && (
        <p className="text-yellow-300 font-medium">
          ✅ Dados exportados com sucesso!
        </p>
      )}
      {migrationStage === "importing" && (
        <p className="text-green-300 font-medium">
          📥 Importando dados para o banco de destino...
        </p>
      )}
      {migrationStage === "done" && (
        <p className="text-green-200 font-semibold">
          ✅ Migração concluída com sucesso!
        </p>
      )}
    </div>

    {migrationStage === "exported" && exportedData && (
      <DownloadModelSection
        downloadFileName={downloadFileName}
        onChangeFileName={onChangeFileName}
        onDownload={onDownload}
        onContinue={onContinue}
      />
    )}

    {migrationStage === "done" && (
      <button
        onClick={onReset}
        className="mt-4 w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
      >
        Nova Migração
      </button>
    )}
  </div>
);
