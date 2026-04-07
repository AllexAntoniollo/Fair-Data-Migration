"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MigrationWizard } from "@/components/MigrationWizard";
import { MigrationConfig } from "@/types/database";

export default function Home() {
  const [migrationConfig, setMigrationConfig] =
    useState<MigrationConfig | null>(null);

  const handleMigrationReady = (config: MigrationConfig) => {
    setMigrationConfig(config);
    // Aqui você pode adicionar lógica para iniciar a migração
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo Futurista */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full z-10"
      >
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Fair Migration Engine
          </h1>
          <p className="text-slate-400 text-lg">
            Migração de dados inteligente e em tempo real
          </p>
        </header>

        {/* Main Content */}
        <MigrationWizard onMigrationConfigReady={handleMigrationReady} />
      </motion.div>
    </div>
  );
}
