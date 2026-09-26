import LedgerBars from "./LedgerBars.jsx";
import HourWave from "./HourWave.jsx";

export default function ChartsGrid({ breakdowns }) {
  const { byCategory = [], byDevice = [], byPayment = [], byHour = [] } = breakdowns || {};

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <HourWave data={byHour} />
      <LedgerBars title="Fraud by merchant category" rows={byCategory} accent="#6D8CFF" />
      <LedgerBars title="Fraud by device" rows={byDevice} accent="#35C88E" />
      <LedgerBars title="Fraud by payment method" rows={byPayment} accent="#F2A93B" />
    </div>
  );
}
