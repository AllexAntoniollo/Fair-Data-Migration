"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Globe,
  Key,
  User,
  Server,
  Database as DbIcon,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  DatabaseType,
  DatabaseConfig,
  DATABASE_METADATA,
} from "@/types/database";

interface ConnectionFormProps {
  databaseType: DatabaseType;
  onSubmit: (config: DatabaseConfig) => void;
  isLoading?: boolean;
}

const fieldConfigs = {
  host: {
    label: "Host",
    type: "text",
    placeholder: "localhost ou db.example.com",
    icon: <Globe size={18} />,
  },
  port: {
    label: "Porta",
    type: "number",
    placeholder: "5432",
    icon: <Server size={18} />,
  },
  user: {
    label: "Usuário",
    type: "text",
    placeholder: "root",
    icon: <User size={18} />,
  },
  password: {
    label: "Senha",
    type: "password",
    placeholder: "••••••••",
    icon: <Key size={18} />,
  },
  database: {
    label: "Banco",
    type: "text",
    placeholder: "main_db",
    icon: <DbIcon size={18} />,
  },
  authSource: {
    label: "Auth Source",
    type: "text",
    placeholder: "admin",
    icon: <ShieldCheck size={18} />,
  },
  name: {
    label: "Identificador",
    type: "text",
    placeholder: "Ex: Produção AWS",
    icon: <Activity size={18} />,
  },
} as const;

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  databaseType,
  onSubmit,
  isLoading = false,
}) => {
  const metadata = DATABASE_METADATA[databaseType];
  const [formData, setFormData] = React.useState<Partial<DatabaseConfig>>({
    type: databaseType,
    name: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ["name", ...metadata.fields.required] as string[];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof DatabaseConfig]) {
        newErrors[field] = "Campo obrigatório";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({ ...formData, type: databaseType } as DatabaseConfig);
  };

  const allFields = [
    "name",
    ...metadata.fields.required,
    ...metadata.fields.optional,
  ];

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full space-y-6"
    >
      {/* Header do Form */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 text-blue-400">
          {metadata.icon}
        </div>
        <div>
          <h4 className="text-xl font-bold text-white tracking-tight">
            Configurar {metadata.label}
          </h4>
          <p className="text-sm text-slate-400">
            Insira as credenciais para estabelecer o túnel.
          </p>
        </div>
      </div>

      {/* Grid de Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allFields
          .filter((f) => f !== "type" && f !== "ssl")
          .map((field) => {
            const config = fieldConfigs[field as keyof typeof fieldConfigs] || {
              label: field,
              type: "text",
              placeholder: "",
              icon: <DbIcon size={18} />,
            };
            const hasError = !!errors[field];

            return (
              <div
                key={field}
                className={field === "name" ? "md:col-span-2" : ""}
              >
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {config.label}
                </label>

                <div className="relative group">
                  <div
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${hasError ? "text-red-400" : "text-slate-500 group-focus-within:text-blue-400"}`}
                  >
                    {config.icon}
                  </div>

                  <input
                    type={config.type}
                    placeholder={config.placeholder}
                    value={(formData as any)[field] || ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={`w-full bg-slate-900/50 border backdrop-blur-md px-11 py-3 rounded-xl outline-none transition-all
                      ${
                        hasError
                          ? "border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20"
                          : "border-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                      } text-slate-200 placeholder:text-slate-600`}
                  />

                  <AnimatePresence>
                    {hasError && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400"
                      >
                        <AlertCircle size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
      </div>

      {/* SSL Toggle */}
      {metadata.fields.optional.includes("ssl" as any) && (
        <div
          onClick={() => handleChange("ssl", !(formData as any).ssl)}
          className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800/50 transition-all"
        >
          <div
            className={`w-10 h-5 rounded-full relative transition-colors ${(formData as any).ssl ? "bg-blue-600" : "bg-slate-600"}`}
          >
            <motion.div
              animate={{ x: (formData as any).ssl ? 22 : 2 }}
              className="absolute top-1 w-3 h-3 bg-white rounded-full"
            />
          </div>
          <span className="text-sm font-medium text-slate-300 select-none">
            Habilitar criptografia SSL
          </span>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        disabled={isLoading}
        whileHover={{
          scale: 1.01,
          boxShadow: "0 0 20px rgba(37, 99, 235, 0.2)",
        }}
        whileTap={{ scale: 0.98 }}
        className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all mt-4 group"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sincronizando Fair...</span>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <span>Testar Conexão</span>
              <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.form>
  );
};
