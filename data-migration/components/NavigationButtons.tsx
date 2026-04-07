"use client";

import React from "react";
import { Step } from "./stepTypes";

interface NavigationButtonsProps {
  step: Step;
  onBack: () => void;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  step,
  onBack,
}) => {
  if (
    step === "selectSource" ||
    step === "preview" ||
    step === "selectTables" ||
    step === "selectColumns"
  ) {
    return null;
  }

  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={onBack}
        className="px-4 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        ← Voltar
      </button>
    </div>
  );
};
