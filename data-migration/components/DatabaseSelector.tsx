"use client";

import React from "react";
import { motion } from "framer-motion";
import { DatabaseType, DATABASE_METADATA } from "@/types/database";

interface DatabaseSelectorProps {
  label: string;
  selected: DatabaseType | "";
  onSelect: (db: DatabaseType) => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  label,
  selected,
  onSelect,
}) => {
  const databases: DatabaseType[] = Object.keys(
    DATABASE_METADATA,
  ) as DatabaseType[];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-white">{label}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {databases.map((db) => (
          <motion.button
            key={db}
            onClick={() => onSelect(db)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
              selected === db
                ? "border-blue-500 bg-blue-900/40"
                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
            }`}
          >
            <span className="text-2xl">{DATABASE_METADATA[db].icon}</span>
            <span className="text-sm font-medium text-slate-200">
              {DATABASE_METADATA[db].label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
