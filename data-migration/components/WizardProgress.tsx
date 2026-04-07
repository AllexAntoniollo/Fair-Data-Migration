"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Step } from "./stepTypes";
import React from "react";

interface WizardProgressProps {
  progressSteps: Step[];
  currentStep: Step;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  progressSteps,
  currentStep,
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-2">
      {progressSteps.map((s, idx) => {
        const isActive = currentStep === s;
        const isCompleted = progressSteps.indexOf(currentStep) > idx;

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
  </div>
);
