"use client";

import { ArrowRight } from "lucide-react";
import { DatabaseConfig, DATABASE_METADATA } from "@/types/database";
import React from "react";

interface PreviewStepProps {
  sourceConfig: DatabaseConfig;
  destConfig: DatabaseConfig;
  isLoading: boolean;
  onBack: () => void;
  onReset: () => void;
  onNext: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({
  sourceConfig,
  destConfig,
  isLoading,
  onBack,
  onReset,
  onNext,
}) => (
  <div className="space-y-4">
    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-white">
        ✅ Configuração Pronta!
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
            <span>{DATABASE_METADATA[sourceConfig.type].icon}</span>
            Origem: {sourceConfig.name}
          </h4>
          <div className="text-sm text-blue-300 space-y-1">
            <p>
              <strong>Tipo:</strong>{" "}
              {DATABASE_METADATA[sourceConfig.type].label}
            </p>
            <p>
              <strong>Host:</strong> {sourceConfig.host}
            </p>
            <p>
              <strong>Porta:</strong> {sourceConfig.port}
            </p>
            <p>
              <strong>Banco:</strong> {sourceConfig.database}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="text-gray-400 rotate-90" size={24} />
        </div>

        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <h4 className="font-semibold text-green-200 mb-2 flex items-center gap-2">
            <span>{DATABASE_METADATA[destConfig.type].icon}</span>
            Destino: {destConfig.name}
          </h4>
          <div className="text-sm text-green-300 space-y-1">
            <p>
              <strong>Tipo:</strong> {DATABASE_METADATA[destConfig.type].label}
            </p>
            <p>
              <strong>Host:</strong> {destConfig.host}
            </p>
            <p>
              <strong>Porta:</strong> {destConfig.port}
            </p>
            <p>
              <strong>Banco:</strong> {destConfig.database}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 px-4 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        ← Voltar
      </button>
      <button
        onClick={onReset}
        className="flex-1 px-4 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        Recomeçar
      </button>
      <button
        onClick={onNext}
        disabled={isLoading}
        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
      >
        {isLoading ? "Carregando..." : "Próximo: Selecionar Tabelas"}
      </button>
    </div>
  </div>
);
