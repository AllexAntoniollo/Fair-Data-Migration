"use client";

import React from "react";

interface DownloadModelSectionProps {
  downloadFileName: string;
  onChangeFileName: (value: string) => void;
  onDownload: () => void;
  onContinue: () => void;
}

export const DownloadModelSection: React.FC<DownloadModelSectionProps> = ({
  downloadFileName,
  onChangeFileName,
  onDownload,
  onContinue,
}) => (
  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-600 space-y-4">
    <h4 className="font-semibold text-slate-200 flex items-center gap-2">
      💾 Baixar Modelo Intermediário
    </h4>
    <p className="text-sm text-slate-400">
      Salve os dados exportados para uso posterior ou compartilhamento
    </p>

    <div className="flex gap-2">
      <input
        type="text"
        value={downloadFileName}
        onChange={(e) => onChangeFileName(e.target.value)}
        placeholder="Nome do arquivo"
        className="flex-1 px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-100 text-sm"
      />
      <span className="text-slate-400 text-sm px-2 py-2 self-center">
        .json
      </span>
    </div>

    <button
      onClick={onDownload}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
    >
      Download Modelo
    </button>
    <button
      onClick={onContinue}
      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
    >
      Continuar com Migração
    </button>
  </div>
);
