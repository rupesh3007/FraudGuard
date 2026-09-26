import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, PlayCircle } from "lucide-react";

const STEPS = [
  { n: 1, key: "upload", label: "Upload", detail: "Drop a transaction CSV" },
  { n: 2, key: "analyze", label: "Analyze", detail: "Rules + model evaluation when labeled" },
  { n: 3, key: "review", label: "Review", detail: "Metrics, charts, ledger" },
];

const stageIndex = { idle: 0, uploading: 1, analyzing: 1, done: 2, error: 0 };

export default function UploadDock({ stage, fileName, rowCount, error, onFile, onRunDemo }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const busy = stage === "uploading" || stage === "analyzing";
  const active = stageIndex[stage] ?? 0;

  function handleFiles(files) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <section id="upload" className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-400">D1 · deployed pipeline</p>
          <h2 className="mt-3 font-display text-[1.9rem] font-semibold tracking-tight text-paper-50">
            Bring your own data
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-paper-400">
            Upload a transaction CSV for backend cleaning, feature engineering,
            and rule checks. A classifier is trained and evaluated only when
            the file includes verified fraud labels.
          </p>

          <ol className="mt-8 space-y-5">
            {STEPS.map((s, i) => {
              const state = i < active ? "done" : i === active ? (busy ? "active" : stage === "done" ? "done" : "active") : "pending";
              return (
                <li key={s.key} className="flex gap-3.5">
                  <div
                    className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border font-mono text-[11px] ${
                      state === "done"
                        ? "border-signal-safe/40 bg-signal-safeSoft text-signal-safe"
                        : state === "active"
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-400"
                        : "border-hairline text-paper-500"
                    }`}
                  >
                    {state === "done" ? <CheckCircle2 size={13} /> : s.n}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-paper-100">{s.label}</div>
                    <div className="text-[12.5px] text-paper-500">{s.detail}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => !busy && inputRef.current?.click()}
            className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver
                ? "border-brand-400 bg-brand-500/5"
                : "border-ink-500 bg-ink-800/40 hover:border-brand-500/40 hover:bg-ink-800/70"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <AnimatePresence mode="wait">
              {busy ? (
                <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-brand-400" size={30} />
                  <div className="font-mono text-[13px] text-paper-100">
                    {stage === "uploading" ? "Uploading CSV…" : "Running detection pipeline…"}
                  </div>
                  <div className="text-[12px] text-paper-500">{fileName}</div>
                </motion.div>
              ) : stage === "done" ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="text-signal-safe" size={30} />
                  <div className="font-mono text-[13px] text-paper-100">{fileName}</div>
                  <div className="text-[12.5px] text-paper-500">
                    {rowCount ? `${rowCount.toLocaleString()} rows processed` : "Processed"} — results below
                  </div>
                  <span className="mt-1 text-[12.5px] text-brand-400 underline underline-offset-2">
                    Upload a different file
                  </span>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                  <UploadCloud className="text-paper-500" size={30} />
                  <div className="text-[14.5px] font-medium text-paper-100">
                    Drag a CSV here, or click to browse
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-paper-500">
                    <FileSpreadsheet size={13} /> .csv up to ~50MB
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-signal-alert/30 bg-signal-alertSoft/40 px-3.5 py-2.5 text-[13px] text-red-200">
              <AlertCircle size={15} className="mt-0.5 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={onRunDemo}
              disabled={busy}
              className="flex items-center gap-1.5 text-[13px] font-medium text-paper-500 transition-colors hover:text-paper-100 disabled:opacity-40"
            >
              <PlayCircle size={15} />
              Don't have a file? Run the sample dataset
            </button>
            <span className="font-mono text-[11px] text-paper-500">CSV uploaded to backend for analysis</span>
          </div>
        </div>
      </div>
    </section>
  );
}
