import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Disable chart animations for smoother scrolling on Radar */
const ANIMATE = false;

const gridStroke = "rgba(148, 163, 184, 0.12)";
const tooltipStyle = {
  background: "#0d1526",
  border: "1px solid rgba(37, 99, 235, 0.3)",
  borderRadius: 8,
  fontSize: 12,
};

export function SparkLine({ data, color = "#2563eb", height = 48 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={ANIMATE} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SparkArea({ data, color = "#2563eb", height = 48 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  const gradId = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradId})`} isAnimationActive={ANIMATE} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SparkBar({ data, color = "#7c3aed", height = 48 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <BarChart data={data}>
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={ANIMATE} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({ data, height = 220 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <AreaChart data={data}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="you" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} isAnimationActive={ANIMATE} />
        <Area type="monotone" dataKey="a" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} isAnimationActive={ANIMATE} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IntensityBarChart({ data, height = 128 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <div className="plt-intensity-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fill: "#8a96a8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="intensity" fill="#c8933a" radius={[4, 4, 0, 0]} isAnimationActive={ANIMATE} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardAreaChart({ data, height = 280 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <AreaChart data={data}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="signals" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} isAnimationActive={ANIMATE} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PositionRadar({ data, height = 200 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(148,163,184,0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <Radar name="You" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} isAnimationActive={ANIMATE} />
        <Radar name="Market" dataKey="B" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} isAnimationActive={ANIMATE} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function SharePie({ data, height = 200 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  const colors = ["#2563eb", "#7c3aed", "#06b6d4", "#64748b"];
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} isAnimationActive={ANIMATE}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CompareBar({ data, height = 200 }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height }} />;
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} isAnimationActive={ANIMATE} />
      </BarChart>
    </ResponsiveContainer>
  );
}
