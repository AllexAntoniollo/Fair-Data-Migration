"use client";

import React from "react";

interface TableSelectionStepProps {
  availableTables: string[];
  selectedTables: string[];
  isLoading: boolean;
  onToggleTable: (table: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const TableSelectionStep: React.FC<TableSelectionStepProps> = ({
  availableTables,
  selectedTables,
  isLoading,
  onToggleTable,
  onBack,
  onNext,
}) => (
  <div className="space-y-4">
    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-white">
        📊 Tabelas Disponíveis
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {availableTables.map((table) => (
          <label
            key={table}
            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
              selectedTables.includes(table)
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-700 bg-slate-800 hover:border-slate-600"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedTables.includes(table)}
              onChange={() => onToggleTable(table)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <span className="font-medium text-slate-200">{table}</span>
          </label>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-300">
          <strong>Selecionadas:</strong> {selectedTables.length} de{" "}
          {availableTables.length} tabelas
        </p>
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
        disabled={selectedTables.length === 0 || isLoading}
        onClick={onNext}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Carregando..." : "Próximo: Selecionar Colunas"}
      </button>
    </div>
  </div>
);
