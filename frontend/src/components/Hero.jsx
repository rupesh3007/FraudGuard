import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SignalScope from "./SignalScope.jsx";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.7, 0.2, 1] } },
};

export default function Hero({ onUploadClick, onDemoClick }) {
  return (
    <section id="top" className="relative overflow-hidden pt-16 sm:pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] grid-overlay opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12"
      >
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              variants={item}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-ink-800/70 px-3 py-1"
            >
              <span className="font-mono text-[11px] text-paper-500">
                FinTech Fraud Detection Hackathon · Deployed Submission
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-paper-50 sm:text-[3.4rem]"
            >
              Every transaction
              <br />
              tells on itself.
            </motion.h1>

            <motion.p variants={item} className="mt-5 max-w-md text-[16px] leading-relaxed text-paper-400">
              Drop in a transaction CSV for rule-based checks and fraud patterns.
              When verified fraud labels are present, FraudGuard also evaluates
              a classifier and reports its held-out performance.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onUploadClick}
                className="group flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-ink-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Analyze a dataset
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={onDemoClick}
                className="rounded-md border border-hairline px-5 py-2.5 text-[14px] font-medium text-paper-100 transition-colors hover:border-brand-500/40 hover:bg-ink-800"
              >
                View demo results
              </button>
            </motion.div>

            <motion.div variants={item} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-6">
              {[
                ["Detection layers", "Rules + ML"],
                ["Fraud types classified", "4"],
                ["Backend processing", "CSV → results"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="font-mono text-[13px] text-paper-50">{value}</div>
                  <div className="text-[11.5px] text-paper-500">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={item}>
            <SignalScope />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
