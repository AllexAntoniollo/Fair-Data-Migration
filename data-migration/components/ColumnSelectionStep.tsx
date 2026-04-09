"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface ColumnSelectionStepProps {
  selectedTables: string[];
  tableColumns: Record<string, string[]>;
  selectedColumns: Record<string, string[]>;
  columnMappings: Record<string, Record<string, string>>;
  tableMappings: Record<string, string>;
  isLoading: boolean;
  onToggleColumn: (table: string, column: string) => void;
  onUpdateColumnMapping: (
    table: string,
    sourceColumn: string,
    destColumn: string,
  ) => void;
  onUpdateTableMapping: (table: string, destTable: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ColumnSelectionStep: React.FC<ColumnSelectionStepProps> = ({
  selectedTables,
  tableColumns,
  selectedColumns,
  columnMappings,
  tableMappings,
  isLoading,
  onToggleColumn,
  onUpdateColumnMapping,
  onUpdateTableMapping,
  onBack,
  onNext,
}) => (
  <div className="space-y-4">
    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold mb-2 text-white">
        📋 Mapeio de Colunas
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Configure quais colunas deseja migrar e como elas serão nomeadas no
        banco de destino
      </p>

      <div className="space-y-8">
        {selectedTables.map((table) => (
          <div
            key={table}
            className="border border-slate-700 rounded-lg p-5 bg-slate-800/50"
          >
            <h4 className="font-semibold text-slate-200 mb-4">
              📊 Tabela de Origem:{" "}
              <span className="text-blue-300">{table}</span>
            </h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome da tabela no destino
              </label>
              <input
                type="text"
                value={tableMappings[table] || table}
                onChange={(e) => onUpdateTableMapping(table, e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-600 outline-0 bg-slate-900 text-slate-100"
                placeholder="Nome da tabela de destino"
              />
            </div>

            <div className="space-y-3">
              {(tableColumns[table] || []).map((column) => (
                <div
                  key={`${table}-${column}`}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    selectedColumns[table]?.includes(column)
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-slate-700/50 border-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns[table]?.includes(column) || false}
                    onChange={() => onToggleColumn(table, column)}
                    className="w-5 h-5 rounded cursor-pointer shrink-0"
                  />
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      <div className="text-sm font-semibold text-blue-200 bg-blue-500/20 px-3 py-2 rounded whitespace-nowrap truncate max-w-xs border border-blue-500/30">
                        {column}
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={columnMappings[table]?.[column] || column}
                      onChange={(e) =>
                        onUpdateColumnMapping(table, column, e.target.value)
                      }
                      disabled={!selectedColumns[table]?.includes(column)}
                      className={`flex-1 px-3 py-2 rounded border font-semibold min-w-0 ${
                        selectedColumns[table]?.includes(column)
                          ? "border-green-500/30 bg-green-500/10 text-green-200 outline-0"
                          : "border-slate-600 bg-slate-700 text-slate-500 cursor-not-allowed"
                      }`}
                      placeholder="Nome no banco de destino"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-400 mt-3 ml-8">
              {selectedColumns[table]?.length || 0} de{" "}
              {tableColumns[table]?.length || 0} colunas selecionadas
            </div>
          </div>
        ))}
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
        onClick={onNext}
        className="flex-1 px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800"
      >
        Próximo: escolher algoritmo
      </button>
    </div>
  </div>
);
