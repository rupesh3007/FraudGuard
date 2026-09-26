import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber.jsx";

function FraudDial({ pct }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const dash = (clamped / 100) * circ;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-hairline bg-ink-800/70 p-6 shadow-card sm:col-span-2 sm:flex-row sm:items-center">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500">Fraud rate</p>
        <div className="mt-2 font-display text-[2.6rem] font-semibold leading-none text-paper-50">
          <AnimatedNumber value={pct} decimals={1} suffix="%" />
        </div>
        <p className="mt-3 max-w-[22ch] text-[13px] leading-relaxed text-paper-500">
          of processed transactions were flagged by the rule engine or classifier.
        </p>
      </div>

      <div className="relative mt-6 h-[132px] w-[132px] flex-none sm:mt-0">
        <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
          <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(233,238,255,0.08)" strokeWidth="9" />
          <motion.circle
            cx="66"
            cy="66"
            r={r}
            fill="none"
            stroke="#F2545B"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-2 w-2 animate-blink rounded-full bg-signal-alert" />
        </div>
      </div>
    </div>
  );
}

function Tape({ label, value, decimals = 0, suffix = "", tone = "default" }) {
  const toneClass =
    tone === "safe" ? "text-signal-safe" : tone === "brand" ? "text-brand-400" : "text-paper-50";
  return (
    <div className="rounded-xl border border-hairline bg-ink-800/70 p-6 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500">{label}</p>
      <div className={`mt-2 font-mono text-[2rem] font-semibold leading-none ${toneClass}`}>
        {value == null ? "—" : <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />}
      </div>
    </div>
  );
}

export default function KpiRow({ summary }) {
  const {
    total_transactions = 0,
    num_frauds = 0,
    fraud_percentage = 0,
    accuracy = null,
    f1_score = null,
    precision = null,
    recall = null,
    metrics_available = true,
    evaluation_method = "",
    model_train_seconds = null,
  } = summary || {};

  return (
    <div id="insights" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FraudDial pct={fraud_percentage} />
      <Tape label="Total transactions" value={total_transactions} />
      <Tape label="Fraud detected" value={num_frauds} tone="default" />
      <Tape label="Model F1 score" value={f1_score} decimals={2} tone="brand" />
      <Tape label="Model accuracy" value={accuracy} decimals={2} tone="safe" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-hairline bg-ink-800/40 px-6 py-4 sm:col-span-2 lg:col-span-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          <span className="text-[12.5px] text-paper-500">Precision</span>
          <span className="font-mono text-[13px] text-paper-100">{precision == null ? "—" : precision.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-warn" />
          <span className="text-[12.5px] text-paper-500">Recall</span>
          <span className="font-mono text-[13px] text-paper-100">{recall == null ? "—" : recall.toFixed(2)}</span>
        </div>
        <div className="hidden flex-1 justify-end text-right font-mono text-[11px] text-paper-500 sm:flex">
          {metrics_available
            ? `Random forest · ${evaluation_method || "holdout evaluation"}${model_train_seconds == null ? "" : ` · fit ${Number(model_train_seconds).toFixed(1)}s`}`
            : evaluation_method || "Supervised metrics unavailable"}
        </div>
      </div>
    </div>
  );
}
