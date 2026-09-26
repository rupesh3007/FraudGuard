import { motion } from "framer-motion";

const RISK_STYLE = {
  high: "border-signal-alert/30 bg-signal-alertSoft/50 text-red-200",
  medium: "border-signal-warn/30 bg-signal-warnSoft/50 text-amber-200",
  low: "border-signal-safe/30 bg-signal-safeSoft/50 text-emerald-200",
};

export default function TransactionLog({ transactions }) {
  return (
    <section id="ledger" className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-400">Flagged ledger</p>
          <h2 className="mt-2 font-display text-[1.7rem] font-semibold tracking-tight text-paper-50">
            Most recent detections
          </h2>
        </div>
        <span className="hidden font-mono text-[11px] text-paper-500 sm:block">
          {transactions.length} rows shown
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline bg-ink-800/80">
                {["Transaction", "Merchant", "Amount", "Risk", "Signal", "Detected"].map((h) => (
                  <th key={h} className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-paper-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-paper-500">
                    No flagged transactions yet — upload a dataset to populate this ledger.
                  </td>
                </tr>
              )}
              {transactions.map((t, i) => (
                <motion.tr
                  key={t.id + i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4 }}
                  className="border-b border-hairline/70 bg-ink-800/30 transition-colors last:border-b-0 hover:bg-ink-800/70"
                >
                  <td className="px-5 py-3.5 font-mono text-[12.5px] text-paper-100">{t.id}</td>
                  <td className="px-5 py-3.5 text-[13px] text-paper-100">{t.merchant}</td>
                  <td className="px-5 py-3.5 font-mono text-[13px] text-paper-50">{t.amount}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${RISK_STYLE[t.risk] || RISK_STYLE.low}`}
                    >
                      {t.risk}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-paper-400">{t.flag}</td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-paper-500">{t.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
