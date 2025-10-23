"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function Confetti({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-60 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className="rounded-3xl bg-white/90 px-6 py-4 text-center shadow-xl ring-1 ring-black/5"
          >
            <div className="text-5xl">🎉</div>
            <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-vibe-purple)" }}>It's a match!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


