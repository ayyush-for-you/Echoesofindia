"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { useToast, ToastItem } from "../../store/ToastContext";

function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const typeConfig = {
    success: {
      border: "border-emerald-500/50",
      bg: "bg-black/90",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
      bar: "bg-emerald-400",
      textColor: "text-emerald-100",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    },
    error: {
      border: "border-red-500/50",
      bg: "bg-black/90",
      icon: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
      bar: "bg-red-400",
      textColor: "text-red-100",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    },
    info: {
      border: "border-[#D4AF37]/50",
      bg: "bg-black/90",
      icon: <Sparkles className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      bar: "bg-[#D4AF37]",
      textColor: "text-[#FDF5E6]",
      glow: "shadow-[0_0_20px_rgba(212,175,55,0.25)]",
    },
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border ${config.border} ${config.bg} ${config.glow} backdrop-blur-md p-4 w-full shadow-2xl flex flex-col gap-2`}
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <p className={`text-xs sm:text-sm font-medium leading-relaxed flex-1 ${config.textColor}`}>
          {toast.message}
        </p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated 4-second progress bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full ${config.bar}`}
          style={{
            animation: "toastProgress 4s linear forwards",
          }}
        />
      </div>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-[calc(100vw-3rem)]"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </aside>
  );
}
