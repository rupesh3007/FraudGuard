// Offline fallback so the dashboard still renders something meaningful
// if the FastAPI backend is unreachable (cold start, judge's network, etc).
// Numbers are shaped to match the hackathon brief's worked example.

export const DEMO_SUMMARY = {
  total_transactions: 118834,
  num_frauds: 11982,
  fraud_percentage: 10.1,
  accuracy: null,
  precision: null,
  recall: null,
  f1_score: null,
  metrics_available: false,
  evaluation_method: "Offline demo data; model metrics unavailable",
};

export const DEMO_BREAKDOWNS = {
  byCategory: [
    { name: "Electronics", count: 2840 },
    { name: "Crypto Exchange", count: 2415 },
    { name: "Travel", count: 1962 },
    { name: "ATM", count: 1580 },
    { name: "Groceries", count: 1204 },
    { name: "Entertainment", count: 998 },
    { name: "Wire Transfer", count: 983 },
  ],
  byDevice: [
    { name: "Mobile · Android", count: 4120 },
    { name: "Mobile · iOS", count: 3266 },
    { name: "Desktop · Web", count: 2588 },
    { name: "POS Terminal", count: 1408 },
    { name: "ATM Kiosk", count: 600 },
  ],
  byPayment: [
    { name: "UPI", count: 3812 },
    { name: "Credit Card", count: 3120 },
    { name: "Net Banking", count: 2244 },
    { name: "Wire Transfer", count: 1706 },
    { name: "Debit Card", count: 1100 },
  ],
  byHour: [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  ].map((h) => ({
    hour: h,
    count: Math.round(
      180 +
        520 * Math.exp(-Math.pow(h - 2, 2) / 6) +
        360 * Math.exp(-Math.pow(h - 23, 2) / 8) +
        90 * Math.sin(h / 2)
    ),
  })),
};

export const DEMO_TRANSACTIONS = [
  { id: "TXN-88213", merchant: "Crypto Exchange XG", amount: "$14,920", risk: "high", flag: "Velocity Fraud", time: "2m ago" },
  { id: "TXN-88192", merchant: "Overseas Wire BV", amount: "$3,440", risk: "medium", flag: "Behavioral Anomaly", time: "7m ago" },
  { id: "TXN-88177", merchant: "DarkStore Electronics", amount: "$5,200", risk: "high", flag: "High Amount Fraud", time: "18m ago" },
  { id: "TXN-88164", merchant: "ShadowPay Ltd", amount: "$8,700", risk: "high", flag: "Velocity Fraud", time: "31m ago" },
  { id: "TXN-88150", merchant: "QuickCash ATM", amount: "$2,100", risk: "medium", flag: "Behavioral Anomaly", time: "44m ago" },
  { id: "TXN-88139", merchant: "Global Travel Co", amount: "$6,890", risk: "high", flag: "High Amount Fraud", time: "1h ago" },
];
