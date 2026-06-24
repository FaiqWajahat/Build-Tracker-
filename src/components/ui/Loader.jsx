"use client";

import { motion } from "framer-motion";

export default function Loader({ message = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/30 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center pointer-events-auto"
    >
      <div className="flex flex-col items-center gap-3.5 bg-card/75 border border-border/80 px-6 py-5 rounded-2xl shadow-xl backdrop-blur-md max-w-[240px] text-center">
        {/* Sleek Minimalist Double Spinner */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 border-2 border-primary/10 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          />
          <motion.div
            className="absolute w-6 h-6 border-2 border-transparent border-t-primary/60 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
          />
        </div>

        {/* Message */}
        {message && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-foreground tracking-wide font-sans">
              {message}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">
              Processing
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
