import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-hairline bg-ink-900 px-3 py-2 shadow-card">
      <div className="font-mono text-[11px] text-paper-500">{String(label).padStart(2, "0")}:00</div>
      <div className="font-mono text-[13px] text-signal-alert">{payload[0].value.toLocaleString()} flagged</div>
    </div>
  );
}

export default function HourWave({ data }) {
  const hasData = Array.isArray(data) && data.length > 0;
  return (
    <div className="rounded-xl border border-hairline bg-ink-800/70 p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500">Fraud rate by hour of day</p>
        <span className="text-[11.5px] text-paper-500">24h window</span>
      </div>

      {hasData ? (
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2545B" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#F2545B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(233,238,255,0.06)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(h) => String(h).padStart(2, "0")}
                stroke="rgba(233,238,255,0.15)"
                tick={{ fill: "#9AA3C1", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                interval={3}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(233,238,255,0.15)"
                tick={{ fill: "#9AA3C1", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                width={40}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#F2545B", strokeOpacity: 0.25 }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#F2545B"
                strokeWidth={2}
                fill="url(#hourFill)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-16 text-center text-[13px] text-paper-500">
          No timestamp column detected in this dataset.
        </p>
      )}
    </div>
  );
}
