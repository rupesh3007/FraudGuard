import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import UploadDock from "./components/UploadDock.jsx";
import KpiRow from "./components/KpiRow.jsx";
import ChartsGrid from "./components/ChartsGrid.jsx";
import TransactionLog from "./components/TransactionLog.jsx";
import Footer from "./components/Footer.jsx";
import { uploadCsv, analyzeSession, fetchResults, fetchDemoResults, deriveBreakdowns } from "./lib/api.js";
import { DEMO_SUMMARY, DEMO_BREAKDOWNS, DEMO_TRANSACTIONS } from "./lib/demoData.js";

const GITHUB_URL = "https://github.com/your-team/fraudguard";
const TEAM = []; // e.g. ["Aryan Bhale", "Jiya Singh", "Keshav Sharma"]

const NAV_LINKS = [
  { href: "#upload", label: "Upload" },
  { href: "#insights", label: "Insights" },
  { href: "#ledger", label: "Ledger" },
];

function normalizeSummary(raw) {
  if (!raw) return DEMO_SUMMARY;
  const metricsAvailable = raw.metrics_available !== false;
  return {
    total_transactions: raw.total_transactions ?? raw.processed_transactions ?? 0,
    num_frauds: raw.num_frauds ?? 0,
    fraud_percentage: raw.fraud_percentage ?? 0,
    accuracy: metricsAvailable ? raw.accuracy ?? null : null,
    precision: metricsAvailable ? raw.precision ?? null : null,
    recall: metricsAvailable ? raw.recall ?? null : null,
    f1_score: metricsAvailable ? raw.f1_score ?? null : null,
    metrics_available: metricsAvailable,
    evaluation_method: raw.evaluation_method ?? "",
    model_train_seconds: raw.model_train_seconds ?? null,
    model_predict_seconds: raw.model_predict_seconds ?? null,
  };
}

function mapToLedgerRows(records = [], limit = 20) {
  return records.slice(0, limit).map((r, i) => {
    const risk = r.rule_flag || r.ml_pred ? "high" : "low";
    const amount = Number(r.amount ?? r.transaction_amount ?? r.amt ?? 0);
    return {
      id: r.transaction_id || `TXN-${1000 + i}`,
      merchant: r.merchant_category_label || r.merchant_category || "Unknown",
      amount: `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      risk: r.fraud_type === "High Amount Fraud" ? "high" : risk,
      flag: r.fraud_type || "Flagged",
      time: r.timestamp ? new Date(r.timestamp).toLocaleString() : "—",
    };
  });
}

export default function App() {
  const [stage, setStage] = useState("idle"); // idle | uploading | analyzing | done | error
  const [fileName, setFileName] = useState("sample_transactions.csv");
  const [rowCount, setRowCount] = useState(null);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const [summary, setSummary] = useState(DEMO_SUMMARY);
  const [breakdowns, setBreakdowns] = useState(DEMO_BREAKDOWNS);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);

  const loadDemo = useCallback(async () => {
    setStage("analyzing");
    setError(null);
    try {
      const results = await fetchDemoResults();
      setSummary(normalizeSummary(results));
      setBreakdowns(deriveBreakdowns(results.fraud_transactions));
      setTransactions(mapToLedgerRows(results.fraud_transactions));
      setRowCount(results.processed_transactions);
      setFileName("sample_transactions.csv (backend demo)");
      setLive(true);
    } catch (e) {
      setSummary(DEMO_SUMMARY);
      setBreakdowns(DEMO_BREAKDOWNS);
      setTransactions(DEMO_TRANSACTIONS);
      setFileName("sample_transactions.csv (offline demo)");
      setLive(false);
    } finally {
      setStage("done");
    }
  }, []);

  useEffect(() => {
    loadDemo();
  }, [loadDemo]);

  const handleFile = useCallback(async (file) => {
    setError(null);
    setFileName(file.name);
    setStage("uploading");
    try {
      const uploadRes = await uploadCsv(file);
      setRowCount(uploadRes.rows);

      setStage("analyzing");
      const analyzeRes = await analyzeSession(uploadRes.session_id);
      setSummary(normalizeSummary(analyzeRes.summary));

      const results = await fetchResults(uploadRes.session_id);
      setBreakdowns(deriveBreakdowns(results.fraud_transactions));
      setTransactions(mapToLedgerRows(results.fraud_transactions));
      setLive(true);
      setStage("done");
    } catch (e) {
      setError(e.message || "Something went wrong while processing that file.");
      setStage("error");
    }
  }, []);

  const scrollToUpload = () =>
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  const scrollToInsights = () =>
    document.getElementById("insights")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div  className="flex min-h-screen mx-auto w-full flex-col">
  
      <Navbar live={live} links={NAV_LINKS} githubUrl={GITHUB_URL} />
      <main className="w-full flex-1">
        <Hero onUploadClick={scrollToUpload} onDemoClick={scrollToInsights} />
        <UploadDock
          stage={stage}
          fileName={fileName}
          rowCount={rowCount}
          error={error}
          onFile={handleFile}
          onRunDemo={loadDemo}
        />
    <section className="mx-auto w-full max-w-[1440px] px-6 pb-6 sm:px-8 lg:px-12">
          <KpiRow summary={summary} />
          <ChartsGrid breakdowns={breakdowns} />
        </section>

        <TransactionLog transactions={transactions} />
      </main>
      <Footer githubUrl={GITHUB_URL} team={TEAM} />
    </div>
  );
}
