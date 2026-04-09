"use client";

import React from "react";
import { DatabaseType } from "@/types/database";
import { AlgorithmInfo } from "@/core/types";

interface AlgorithmSelectionStepProps {
  destDb: DatabaseType | "";
  algorithmOptions: AlgorithmInfo[];
  selectedAlgorithm: number;
  isLoading: boolean;
  onSelectAlgorithm: (algorithm: number) => void;
  onBack: () => void;
  onStartMigration: () => Promise<void>;
}

export const AlgorithmSelectionStep: React.FC<AlgorithmSelectionStepProps> = ({
  destDb,
  algorithmOptions,
  selectedAlgorithm,
  isLoading,
  onSelectAlgorithm,
  onBack,
  onStartMigration,
}) => (
  <div className="space-y-4">
    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold mb-2 text-white">
        🔧 Escolha o algoritmo de destino
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Selecione o algoritmo que será usado ao transformar o modelo
        intermediário para o banco de destino.
      </p>

      <div className="grid gap-4">
        {algorithmOptions.map((algorithm) => (
          <button
            key={algorithm.id}
            type="button"
            onClick={() => onSelectAlgorithm(algorithm.id)}
            className={`w-full rounded-2xl border p-4 text-left transition-colors duration-200 ${
              selectedAlgorithm === algorithm.id
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-100"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-100">
                {algorithm.name}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {selectedAlgorithm === algorithm.id ? "Selecionado" : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {algorithm.description}
            </p>
          </button>
        ))}
      </div>
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 px-4 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        ← Voltar
      </button>
      <button
        type="button"
        onClick={onStartMigration}
        disabled={isLoading}
        className="flex-1 px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✨ Iniciar Migração
      </button>
    </div>
  </div>
);
