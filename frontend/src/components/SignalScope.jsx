import { motion } from "framer-motion";

// A steady transaction-stream waveform with one anomalous spike —
// the visual thesis of the whole product, used once, in the hero.
const BASE_PATH =
  "M0,60 C 30,58 55,62 80,60 C 105,58 125,61 150,60 C 175,59 195,60 220,60 " +
  "C 235,60 245,66 255,45 C 262,30 268,10 274,8 C 280,10 286,32 292,50 C 298,62 308,60 320,60 " +
  "C 345,59 365,61 390,60 C 415,59 440,61 465,60 C 490,59 515,61 540,60 C 565,59 590,61 615,60 " +
  "C 640,59 665,61 690,60 C 715,59 740,61 765,60 C 790,59 815,61 840,60";

export default function SignalScope() {
  return (
    <div className="relative h-[220px] w-full overflow-hidden rounded-xl border border-hairline bg-ink-800/60">
      <div className="absolute inset-0 grid-overlay opacity-60" />

      <svg viewBox="0 0 840 120" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="scopeFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D8CFF" stopOpacity="0" />
            <stop offset="15%" stopColor="#6D8CFF" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#6D8CFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6D8CFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* base grid midline */}
        <line x1="0" y1="60" x2="840" y2="60" stroke="rgba(233,238,255,0.08)" strokeWidth="1" />

        {/* the waveform itself */}
        <motion.path
          d={BASE_PATH}
          fill="none"
          stroke="url(#scopeFade)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: [0.2, 0.7, 0.2, 1] }}
        />

        {/* fraud spike marker */}
        <motion.circle
          cx="274"
          cy="8"
          r="4.5"
          fill="#F2545B"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.4, ease: "backOut" }}
        />
        <motion.circle
          cx="274"
          cy="8"
          r="4.5"
          fill="none"
          stroke="#F2545B"
          strokeWidth="1.5"
          animate={{ r: [4.5, 16, 4.5], opacity: [0.9, 0, 0.9] }}
          transition={{ delay: 1.8, duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      </svg>

      {/* fraud tag */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute left-[27%] top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-signal-alert/30 bg-signal-alertSoft/60 px-2.5 py-1"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-signal-alert" />
        <span className="font-mono text-[10.5px] tracking-tight text-red-200">anomaly flagged · 94ms</span>
      </motion.div>

      {/* scan sweep */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-brand-400/10 to-transparent"
        animate={{ x: ["-6rem", "840px"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2.4 }}
      />

      <div className="absolute bottom-3 left-4 font-mono text-[10.5px] text-paper-500">
        stream · txn/sec
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[10.5px] text-paper-500">
        t&minus;24h
      </div>
    </div>
  );
}
