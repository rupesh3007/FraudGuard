import { motion } from "framer-motion";

export default function LedgerBars({ title, rows, accent = "#6D8CFF" }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-hairline bg-ink-800/70 p-6 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500">{title}</p>
      <div className="mt-4 space-y-3.5">
        {rows.length === 0 && (
          <p className="py-6 text-center text-[13px] text-paper-500">No breakdown available in this dataset.</p>
        )}
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] text-paper-100">{r.name}</span>
              <span className="font-mono text-[12.5px] text-paper-500">{r.count.toLocaleString()}</span>
            </div>
            <div className="h-[6px] overflow-hidden rounded-full bg-ink-700">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.count / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
