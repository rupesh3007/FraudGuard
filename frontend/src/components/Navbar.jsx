import { motion } from "framer-motion";
import { Github } from "lucide-react";

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path
        d="M13 2 3 6v6c0 6.2 4.1 10.7 10 12 5.9-1.3 10-5.8 10-12V6L13 2Z"
        stroke="#8AA2FF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 13.4 11.3 16.6 18 9.4"
        stroke="#F5F6FB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar({ live, links, githubUrl }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-10">
        <a href="#top" className="flex items-center gap-2.5">
          <Mark />
          <span className="font-display text-[17px] font-semibold tracking-tight text-paper-50">
            FraudGuard
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13.5px] font-medium text-paper-500 transition-colors hover:text-paper-50"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-hairline bg-ink-800 px-3 py-1.5 sm:flex">
            <motion.span
              className={`h-1.5 w-1.5 rounded-full ${live ? "bg-signal-safe" : "bg-signal-warn"}`}
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="font-mono text-[11px] text-paper-500">
              {live ? "live pipeline" : "demo dataset"}
            </span>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[13px] font-medium text-paper-100 transition-colors hover:border-brand-500/40 hover:bg-ink-800"
          >
            <Github size={14} />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </div>
      <nav aria-label="Main navigation" className="mx-auto grid max-w-[1440px] grid-cols-3 border-t border-hairline px-4 py-2.5 md:hidden">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-center text-[12px] font-medium text-paper-500 transition-colors hover:text-paper-50"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
