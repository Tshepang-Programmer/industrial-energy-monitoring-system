import { useState, type ReactNode } from 'react';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Cpu,
  Fan,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Thermometer,
  Waves,
  Zap,
  Power,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ============================================================
// DEMONSTRATION DATA
// Replace these values with FastAPI responses during integration.
// ============================================================

type Period = 'Daily' | 'Weekly' | 'Monthly';

type Metric = {
  id: string;
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  color: string;
  decimals: number;
};

const metrics: Metric[] = [
  {
    id: 'voltage',
    title: 'Line Voltage',
    value: 231.7,
    unit: 'V',
    icon: Zap,
    color: '#43c6d9',
    decimals: 1,
  },
  {
    id: 'current',
    title: 'Load Current',
    value: 4.27,
    unit: 'A',
    icon: Activity,
    color: '#55d6a0',
    decimals: 2,
  },
  {
    id: 'power',
    title: 'Active Power',
    value: 0.989,
    unit: 'kW',
    icon: Power,
    color: '#b29aff',
    decimals: 3,
  },
  {
    id: 'energy',
    title: 'Energy Today',
    value: 12.94,
    unit: 'kWh',
    icon: Waves,
    color: '#f0b45b',
    decimals: 2,
  },
];

const detailStats: Record<
  string,
  Record<Period, { average: number; minimum: number; maximum: number }>
> = {
  voltage: {
    Daily: { average: 230.8, minimum: 226.1, maximum: 234.5 },
    Weekly: { average: 230.2, minimum: 224.9, maximum: 236.0 },
    Monthly: { average: 229.9, minimum: 223.8, maximum: 237.2 },
  },
  current: {
    Daily: { average: 4.12, minimum: 0.82, maximum: 7.14 },
    Weekly: { average: 4.05, minimum: 0.61, maximum: 8.21 },
    Monthly: { average: 3.98, minimum: 0.42, maximum: 8.63 },
  },
  power: {
    Daily: { average: 0.91, minimum: 0.18, maximum: 1.64 },
    Weekly: { average: 0.88, minimum: 0.12, maximum: 1.81 },
    Monthly: { average: 0.86, minimum: 0.10, maximum: 1.92 },
  },
  energy: {
    Daily: { average: 12.94, minimum: 0.10, maximum: 0.91 },
    Weekly: { average: 11.82, minimum: 8.41, maximum: 14.20 },
    Monthly: { average: 352.6, minimum: 280.4, maximum: 398.2 },
  },
  powerFactor: {
    Daily: { average: 0.94, minimum: 0.86, maximum: 0.99 },
    Weekly: { average: 0.93, minimum: 0.82, maximum: 0.99 },
    Monthly: { average: 0.93, minimum: 0.80, maximum: 0.99 },
  },
  temperature: {
    Daily: { average: 43.8, minimum: 38.2, maximum: 51.4 },
    Weekly: { average: 44.1, minimum: 36.5, maximum: 54.2 },
    Monthly: { average: 43.6, minimum: 34.9, maximum: 56.1 },
  },
  vibration: {
    Daily: { average: 0.19, minimum: 0.08, maximum: 0.42 },
    Weekly: { average: 0.21, minimum: 0.06, maximum: 0.48 },
    Monthly: { average: 0.20, minimum: 0.04, maximum: 0.53 },
  },
};

const energyData = [
  { time: '00', value: 0.18 },
  { time: '02', value: 0.12 },
  { time: '04', value: 0.1 },
  { time: '06', value: 0.28 },
  { time: '08', value: 0.58 },
  { time: '10', value: 0.66 },
  { time: '12', value: 0.69 },
  { time: '14', value: 0.59 },
  { time: '16', value: 0.75 },
  { time: '18', value: 0.91 },
  { time: '20', value: 0.67 },
  { time: '22', value: 0.38 },
];

const vibrationData = [
  [1, 1, 2, 1, 2, 2, 1, 1, 2, 3, 2, 1],
  [1, 2, 1, 2, 3, 2, 2, 1, 3, 2, 2, 1],
  [2, 1, 2, 3, 2, 1, 2, 2, 3, 2, 1, 1],
];

const navItems = [
  { label: 'System Overview', icon: LayoutDashboard },
  { label: 'Electrical Parameters', icon: Zap },
  { label: 'Energy History', icon: Waves },
  { label: 'Temperature Monitoring', icon: Thermometer },
  { label: 'Vibration Analysis', icon: Activity },
  { label: 'Device Management', icon: Radio },
  { label: 'Control & Configuration', icon: Settings },
  { label: 'Alarms & Events', icon: Bell },
];

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function Panel({
  title,
  subtitle,
  children,
  action,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-lg border border-slate-700/80 bg-[#111b26] transition-colors duration-200 hover:border-slate-500 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-700/70 px-4 py-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-100">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-[10px] text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function MeasurementCard({
  metric,
  onClick,
}: {
  metric: Metric;
  onClick: () => void;
}) {
  const Icon = metric.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-lg border border-slate-700 bg-[#111b26] p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/60 hover:bg-[#172633] hover:shadow-lg hover:shadow-cyan-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          {metric.title}
        </span>

        <span className="rounded-md border border-slate-700 p-2 transition-colors group-hover:border-cyan-400/50">
          <Icon size={15} style={{ color: metric.color }} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-white">
          {metric.value.toFixed(metric.decimals)}
        </span>

        <span className="text-[10px] text-slate-400">
          {metric.unit}
        </span>
      </div>

      <p className="mt-2 text-[9px] text-amber-300">
        Demonstration reading
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-slate-700/70 pt-3">
        <span className="text-[9px] text-slate-500">
          Click for detailed analysis
        </span>

        <ChevronRight
          size={13}
          className="text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400"
        />
      </div>
    </button>
  );
}

function InstrumentGauge({
  title,
  subtitle,
  value,
  unit,
  min,
  max,
  color,
  onClick,
}: {
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
  onClick: () => void;
}) {
  const percentage = Math.max(
    0,
    Math.min(1, (value - min) / (max - min)),
  );

  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-lg border border-slate-700 bg-[#111b26] text-left transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/60 hover:bg-[#172633] hover:shadow-lg hover:shadow-cyan-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-700/70 px-3 py-3">
        <div>
          <h3 className="text-xs font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 text-[9px] text-slate-400">
            {subtitle}
          </p>
        </div>

        <CircleGauge
          size={16}
          className="text-cyan-400 transition-transform duration-300 group-hover:rotate-12"
        />
      </div>

      <div className="flex items-center gap-2 p-3 sm:gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full -rotate-[135deg]"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#263645"
              strokeWidth="9"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />

            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeDasharray={`${arcLength * percentage} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-white">
              {value.toFixed(2)}
            </span>

            <span className="text-[8px] text-slate-400">
              {unit}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white">
            Demonstration
          </p>

          <p className="mt-1 text-[9px] leading-relaxed text-slate-400">
            Illustrative operating range
          </p>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>

          <div className="mt-1 flex justify-between gap-1 text-[8px] text-slate-500">
            <span>{min}</span>
            <span>{max} {unit}</span>
          </div>

          <p className="mt-3 text-[9px] text-cyan-400">
            Open analysis →
          </p>
        </div>
      </div>
    </button>
  );
}

function DetailModal({
  metricId,
  title,
  value,
  unit,
  onClose,
}: {
  metricId: string;
  title: string;
  value: number;
  unit: string;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<Period>('Daily');

  const stats = detailStats[metricId]?.[period];

  const trendData = [
    { Daily: '06:00', Weekly: 'Mon', Monthly: 'W1', value: 0.91 },
    { Daily: '08:00', Weekly: 'Tue', Monthly: 'W2', value: 0.96 },
    { Daily: '10:00', Weekly: 'Wed', Monthly: 'W3', value: 0.93 },
    { Daily: '12:00', Weekly: 'Thu', Monthly: 'W4', value: 1.02 },
    { Daily: '14:00', Weekly: 'Fri', Monthly: 'W5', value: 0.98 },
    { Daily: '16:00', Weekly: 'Sat', Monthly: 'W6', value: 0.95 },
    { Daily: '18:00', Weekly: 'Sun', Monthly: 'W7', value: 0.99 },
  ];

  const selectedTrend = trendData.map((point) => ({
    label: point[period],
    value:
      metricId === 'voltage'
        ? 230 * point.value
        : metricId === 'current'
          ? 4.2 * point.value
          : metricId === 'power'
            ? 0.98 * point.value
            : metricId === 'powerFactor'
              ? 0.95 * point.value
              : metricId === 'temperature'
                ? 44 * point.value
                : metricId === 'vibration'
                  ? 0.19 * point.value
                  : 0.65 * point.value,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className="my-auto w-full max-w-3xl rounded-xl border border-slate-700 bg-[#111b26] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-700 p-5">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-400">
              Industrial measurement analysis
            </p>

            <h2
              id="detail-title"
              className="mt-2 text-xl font-semibold text-white"
            >
              {title}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              Demonstration history · Not connected to historical API data
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close measurement analysis"
            className="rounded-md border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] text-slate-400">
                Current demonstration value
              </p>

              <p className="mt-1 text-4xl font-semibold text-white">
                {value.toFixed(2)}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {unit}
                </span>
              </p>
            </div>

            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[9px] text-amber-300">
              Sample data
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(['Daily', 'Weekly', 'Monthly'] as Period[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`rounded-md border px-4 py-2 text-xs transition-colors ${
                  period === item
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Average',
                value: stats?.average,
                icon: Activity,
              },
              {
                label: 'Minimum',
                value: stats?.minimum,
                icon: ArrowDownRight,
              },
              {
                label: 'Maximum',
                value: stats?.maximum,
                icon: ArrowUpRight,
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-700 bg-[#0c151e] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {stat.label}
                    </span>

                    <Icon size={15} className="text-cyan-400" />
                  </div>

                  <p className="mt-3 text-xl font-semibold text-white">
                    {stat.value?.toFixed(2) ?? '—'}
                    <span className="ml-1 text-[10px] font-normal text-slate-400">
                      {unit}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-slate-700 bg-[#0c151e] p-4">
            <h3 className="text-xs font-semibold text-white">
              {period} trend
            </h3>

            <p className="mt-1 text-[9px] text-slate-400">
              Illustrative trend profile
            </p>

            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedTrend}>
                  <defs>
                    <linearGradient
                      id="detailArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#43c6d9"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#43c6d9"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#263645"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="label"
                    stroke="#71869a"
                    fontSize={10}
                  />

                  <YAxis stroke="#71869a" fontSize={10} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b26',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      fontSize: 10,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#43c6d9"
                    strokeWidth={2}
                    fill="url(#detailArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
            In the completed system, these statistics will be calculated from
            timestamped PostgreSQL readings. Additional metrics can include
            standard deviation, peak demand, percentage change and threshold
            violations.
          </p>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-700 px-4 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  variant = 'neutral',
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'neutral' | 'success' | 'danger';
  disabled?: boolean;
}) {
  const styles = {
    neutral:
      'border-slate-600 bg-slate-800 text-slate-200 hover:border-cyan-400/50 hover:bg-slate-700',
    success:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
    danger:
      'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-[10px] font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

function Dashboard() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [activeNavigation, setActiveNavigation] =
    useState('System Overview');

  const [fanOn, setFanOn] = useState(false);
  const [contactorOn, setContactorOn] = useState(false);
  const [buzzerSeconds, setBuzzerSeconds] = useState('5');
  const [buzzerActive, setBuzzerActive] = useState(false);

  const [temperatureThreshold, setTemperatureThreshold] = useState('50');
  const [vibrationThreshold, setVibrationThreshold] = useState('0.40');
  const [voltageHigh, setVoltageHigh] = useState('253');
  const [voltageLow, setVoltageLow] = useState('207');

  const [thresholdsSaved, setThresholdsSaved] = useState(false);
  const [notice, setNotice] = useState(
    'Demonstration mode: controls are not connected to hardware.',
  );

  const [alarms, setAlarms] = useState([
    {
      id: 1,
      time: '09:42:18',
      severity: 'INFO',
      message: 'Dashboard demonstration session started',
    },
  ]);

  const addDemoEvent = (message: string) => {
    setNotice(message);

    setAlarms((previous) => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        severity: 'INFO',
        message,
      },
      ...previous,
    ].slice(0, 8));
  };

  const selected = metrics.find((metric) => metric.id === selectedMetric);

  const openDetail = (id: string) => {
    setSelectedMetric(id);
  };

  const temperatureMetric: Metric = {
    id: 'temperature',
    title: 'Transformer Temperature',
    value: 44.2,
    unit: '°C',
    icon: Thermometer,
    color: '#f0b45b',
    decimals: 1,
  };

  const vibrationMetric: Metric = {
    id: 'vibration',
    title: 'Motor Vibration',
    value: 0.19,
    unit: 'g',
    icon: Activity,
    color: '#55d6a0',
    decimals: 2,
  };

  const devices = [
    {
      name: 'Industrial Control Unit',
      id: 'ICU-01',
      type: 'ESP32',
      status: 'Demo mode',
      color: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    {
      name: 'Transformer Temperature Node',
      id: 'TTMN-01',
      type: 'ESP-01',
      status: 'Not connected',
      color: 'text-slate-400',
      dot: 'bg-slate-500',
    },
    {
      name: 'Motor Vibration Node',
      id: 'MVMN-01',
      type: 'ESP-01',
      status: 'Not connected',
      color: 'text-slate-400',
      dot: 'bg-slate-500',
    },
  ];

  const startBuzzerDemo = () => {
    const seconds = Number(buzzerSeconds);

    if (!Number.isFinite(seconds) || seconds < 1 || seconds > 30) {
      addDemoEvent('Buzzer duration must be between 1 and 30 seconds.');
      return;
    }

    setBuzzerActive(true);
    addDemoEvent(`Demo buzzer activated for ${seconds} seconds.`);

    window.setTimeout(() => {
      setBuzzerActive(false);
      setNotice('Demo buzzer timer completed.');
    }, seconds * 1000);
  };

  const saveThresholdsDemo = () => {
    const values = [
      Number(temperatureThreshold),
      Number(vibrationThreshold),
      Number(voltageHigh),
      Number(voltageLow),
    ];

    if (
      values.some((value) => !Number.isFinite(value) || value < 0) ||
      Number(voltageLow) >= Number(voltageHigh)
    ) {
      addDemoEvent('Check threshold values. The voltage low limit must be less than the high limit.');
      setThresholdsSaved(false);
      return;
    }

    setThresholdsSaved(true);
    addDemoEvent('Demonstration threshold settings saved in the interface.');
  };

  return (
    <div className="min-h-screen bg-[#0b1118] text-slate-100">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/80 bg-[#0d141d] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 p-2">
            <Zap size={21} className="text-cyan-300" />
          </div>

          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">
              INDUSTRIAL ENERGY MONITOR
            </h1>

            <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-400">
              Energy · Power quality · Equipment condition
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[9px] uppercase tracking-wide text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Demonstration mode
          </span>

          <button
            type="button"
            onClick={() => addDemoEvent('Guest session selected. Authentication is not configured.')}
            className="rounded-md border border-slate-700 px-3 py-2 text-[10px] text-slate-300 transition-colors hover:bg-slate-800"
          >
            Guest session
          </button>
        </div>
      </header>

      <div className="md:flex">
        {/* SIDEBAR */}
        <aside className="border-b border-slate-700/80 bg-[#0f1924] p-3 md:min-h-[calc(100vh-65px)] md:w-60 md:shrink-0 md:border-b-0 md:border-r">
          <p className="px-2 pb-3 pt-2 text-[9px] uppercase tracking-[0.17em] text-slate-500">
            System navigation
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNavigation === item.label;

              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    setActiveNavigation(item.label);

                    const target = document.getElementById(
                      item.label.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and'),
                    );

                    target?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-[10px] transition-colors ${
                    active
                      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  {active && (
                    <ChevronRight size={12} className="ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-lg border border-slate-700 bg-[#111b26] p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan-400" />
              <p className="text-[10px] font-semibold text-slate-200">
                System status
              </p>
            </div>

            <p className="mt-2 text-[9px] leading-relaxed text-slate-400">
              Frontend prototype. API communication and hardware control are
              not yet enabled.
            </p>

            <div className="mt-3 flex items-center gap-2 text-[9px] text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Awaiting integration
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7">
          <div className="mx-auto max-w-[1600px]">
            {/* TITLE */}
            <div
              id="system-overview"
              className="mb-5 flex scroll-mt-5 flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-400">
                  Industrial Control Unit / ICU-01
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Energy &amp; Power Quality Overview
                </h2>

                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-400">
                  Multi-input monitoring across electrical, thermal and
                  mechanical parameters, with centralised control configuration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Clock3 size={13} className="text-slate-500" />
                <span className="text-[10px] text-slate-400">
                  Local prototype
                </span>
              </div>
            </div>

            {/* DEMO WARNING */}
            <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-[10px] leading-relaxed text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />

              <p>
                <strong>Demonstration data:</strong> Measurements, charts,
                statistics, control feedback and threshold settings are
                illustrative. No physical hardware commands are being sent.
              </p>
            </div>

            {/* ELECTRICAL CARDS */}
            <section
              id="electrical-parameters"
              className="scroll-mt-5"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold text-slate-200">
                  Electrical measurements
                </h3>

                <span className="text-[9px] text-slate-500">
                  Select a card to analyse
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <MeasurementCard
                    key={metric.id}
                    metric={metric}
                    onClick={() => openDetail(metric.id)}
                  />
                ))}
              </div>
            </section>

            {/* GAUGES */}
            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold text-slate-200">
                  Instrumentation gauges
                </h3>

                <span className="text-[9px] text-slate-500">
                  Hover or click to explore
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <InstrumentGauge
                  title="Power Factor"
                  subtitle="Power utilisation indicator"
                  value={0.94}
                  unit="PF"
                  min={0}
                  max={1}
                  color="#43c6d9"
                  onClick={() => openDetail('powerFactor')}
                />

                <InstrumentGauge
                  title="Voltage Gauge"
                  subtitle="RMS voltage"
                  value={231.7}
                  unit="V"
                  min={180}
                  max={280}
                  color="#55d6a0"
                  onClick={() => openDetail('voltage')}
                />

                <InstrumentGauge
                  title="Current Gauge"
                  subtitle="Electrical load current"
                  value={4.27}
                  unit="A"
                  min={0}
                  max={10}
                  color="#f0b45b"
                  onClick={() => openDetail('current')}
                />
              </div>
            </section>

            {/* ENERGY AND VIBRATION */}
            <section className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
              <div id="energy-history" className="scroll-mt-5">
                <Panel
                  title="Daily energy consumption"
                  subtitle="Illustrative hourly energy profile · kWh"
                  action={
                    <span className="rounded border border-slate-700 px-2 py-1 text-[9px] text-slate-400">
                      24 hours
                    </span>
                  }
                >
                  <div className="mb-3 flex items-center gap-2 text-[9px] text-slate-400">
                    <span className="h-2 w-2 rounded-sm bg-cyan-400" />
                    Energy usage
                    <span className="text-amber-300">Demo</span>
                  </div>

                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={energyData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="#263645"
                          strokeDasharray="3 5"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="time"
                          stroke="#71869a"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          stroke="#71869a"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111b26',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            fontSize: 10,
                          }}
                        />

                        <Bar
                          dataKey="value"
                          name="Energy (kWh)"
                          fill="#43c6d9"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              <div id="vibration-analysis" className="scroll-mt-5">
                <Panel
                  title="Motor vibration heatmap"
                  subtitle="Illustrative vibration intensity by hour"
                  action={
                    <span className="rounded border border-slate-700 px-2 py-1 text-[9px] text-slate-400">
                      MVMN
                    </span>
                  }
                >
                  <div className="grid grid-cols-[42px_repeat(12,minmax(0,1fr))] gap-1">
                    <span />

                    {Array.from({ length: 12 }, (_, index) => (
                      <span
                        key={index}
                        className="text-center text-[7px] text-slate-500"
                      >
                        {String(index * 2).padStart(2, '0')}
                      </span>
                    ))}

                    {vibrationData.map((row, rowIndex) => (
                      <div key={rowIndex} className="contents">
                        <span className="flex items-center text-[8px] text-slate-400">
                          {['X RMS', 'Y RMS', 'Z RMS'][rowIndex]}
                        </span>

                        {row.map((intensity, columnIndex) => (
                          <button
                            type="button"
                            key={`${rowIndex}-${columnIndex}`}
                            title={`Axis ${['X', 'Y', 'Z'][rowIndex]}, hour ${columnIndex * 2}: demonstration intensity ${intensity}`}
                            aria-label={`Open vibration analysis for axis ${['X', 'Y', 'Z'][rowIndex]}`}
                            onClick={() => openDetail('vibration')}
                            className="h-4 rounded-sm transition-all duration-150 hover:scale-110 hover:ring-1 hover:ring-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                            style={{
                              backgroundColor: [
                                '#183643',
                                '#2a7780',
                                '#d6a34c',
                              ][intensity - 1],
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[8px] text-slate-400">
                    <span>Lower intensity</span>

                    {['#183643', '#2a7780', '#d6a34c'].map((color) => (
                      <span
                        key={color}
                        className="h-2.5 w-5 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}

                    <span>Higher intensity</span>
                  </div>

                  <p className="mt-3 text-[9px] leading-relaxed text-slate-400">
                    Select a heatmap cell to inspect vibration statistics.
                    Actual intensity levels will come from sensor readings.
                  </p>
                </Panel>
              </div>
            </section>

            {/* TEMPERATURE AND DEVICE STATUS */}
            <section className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div id="temperature-monitoring" className="scroll-mt-5">
                <Panel
                  title="Transformer temperature"
                  subtitle="DS18B20 · TTMN"
                  action={
                    <Thermometer size={15} className="text-amber-300" />
                  }
                >
                  <button
                    type="button"
                    onClick={() => openDetail('temperature')}
                    className="group w-full rounded-md border border-slate-700/70 bg-[#0c151e] p-4 text-left transition-colors hover:border-cyan-400/50 hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400">
                          Demonstration temperature
                        </p>

                        <p className="mt-2 text-3xl font-semibold text-white">
                          44.2
                          <span className="ml-1 text-sm font-normal text-slate-400">
                            °C
                          </span>
                        </p>

                        <p className="mt-2 text-[9px] text-slate-400">
                          Click to view historical analysis
                        </p>
                      </div>

                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                        <Thermometer size={26} className="text-amber-300" />
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: '44.2%' }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[9px] text-slate-500">
                      <span>0 °C</span>
                      <span>100 °C illustrative scale</span>
                    </div>
                  </button>
                </Panel>
              </div>

              <div id="device-management" className="scroll-mt-5">
                <Panel
                  title="Monitoring node status"
                  subtitle="Distributed sensor network"
                  action={
                    <Radio size={15} className="text-cyan-400" />
                  }
                >
                  <div className="space-y-2">
                    {devices.map((device) => (
                      <div
                        key={device.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-700/70 bg-[#0c151e] p-3 transition-colors hover:border-slate-500"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-md border border-slate-700 bg-slate-800/70 p-2">
                            <Cpu size={15} className="text-cyan-400" />
                          </div>

                          <div>
                            <p className="text-[10px] font-medium text-slate-200">
                              {device.name}
                            </p>

                            <p className="mt-1 text-[9px] text-slate-500">
                              {device.id} · {device.type}
                            </p>
                          </div>
                        </div>

                        <span className={`flex items-center gap-1.5 text-[9px] ${device.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${device.dot}`} />
                          {device.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </section>

            {/* CONTROL PANEL */}
            <section
              id="control-and-configuration"
              className="mt-5 scroll-mt-5"
            >
              <div className="mb-3">
                <p className="text-[9px] uppercase tracking-[0.18em] text-cyan-400">
                  Industrial Control Unit
                </p>

                <h3 className="mt-1 text-sm font-semibold text-white">
                  Control &amp; Configuration
                </h3>

                <p className="mt-1 text-[10px] text-slate-400">
                  Output controls and operating threshold configuration.
                </p>
              </div>

              <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-[10px] leading-relaxed text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />

                <p>
                  <strong>Simulation only:</strong> These buttons change the
                  interface demonstration state. They do not send commands
                  to the ESP32 or energise physical outputs.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                {/* FAN */}
                <Panel
                  title="Cooling fan"
                  subtitle="ICU cooling output"
                  action={<Fan size={16} className="text-cyan-400" />}
                >
                  <div className="flex items-center justify-between gap-3 rounded-md border border-slate-700 bg-[#0c151e] p-3">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        Demonstration state
                      </p>

                      <p className={`mt-1 text-sm font-semibold ${fanOn ? 'text-emerald-300' : 'text-slate-300'}`}>
                        {fanOn ? 'ON' : 'OFF'}
                      </p>
                    </div>

                    <span className={`rounded-md border p-2 ${fanOn ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-500'}`}>
                      <Fan
                        size={22}
                        className={fanOn ? 'animate-spin' : ''}
                      />
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ControlButton
                      variant="success"
                      onClick={() => {
                        setFanOn(true);
                        addDemoEvent('Fan ON requested in demonstration mode.');
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Power size={12} />
                        FAN ON
                      </span>
                    </ControlButton>

                    <ControlButton
                      variant="danger"
                      onClick={() => {
                        setFanOn(false);
                        addDemoEvent('Fan OFF requested in demonstration mode.');
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Power size={12} />
                        FAN OFF
                      </span>
                    </ControlButton>
                  </div>

                  <p className="mt-3 text-[9px] leading-relaxed text-slate-500">
                    Future integration: send a command and wait for ESP32
                    acknowledgement.
                  </p>
                </Panel>

                {/* CONTACTOR */}
                <Panel
                  title="Contactor driver"
                  subtitle="Industrial output control"
                  action={<Power size={16} className="text-amber-300" />}
                >
                  <div className="flex items-center justify-between gap-3 rounded-md border border-slate-700 bg-[#0c151e] p-3">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        Demonstration state
                      </p>

                      <p className={`mt-1 text-sm font-semibold ${contactorOn ? 'text-amber-300' : 'text-slate-300'}`}>
                        {contactorOn ? 'ENERGISED' : 'DE-ENERGISED'}
                      </p>
                    </div>

                    <span className="rounded-md border border-slate-700 p-2 text-amber-300">
                      <Zap size={22} />
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ControlButton
                      variant="success"
                      onClick={() => {
                        setContactorOn(true);
                        addDemoEvent('Contactor energise requested in demonstration mode.');
                      }}
                    >
                      ENERGISE
                    </ControlButton>

                    <ControlButton
                      variant="danger"
                      onClick={() => {
                        setContactorOn(false);
                        addDemoEvent('Contactor de-energise requested in demonstration mode.');
                      }}
                    >
                      DE-ENERGISE
                    </ControlButton>
                  </div>

                  <p className="mt-3 text-[9px] leading-relaxed text-slate-500">
                    Physical operation requires verified driver circuitry,
                    hardware interlocks and independent electrical protection.
                  </p>
                </Panel>

                {/* BUZZER */}
                <Panel
                  title="Buzzer control"
                  subtitle="Timed audible notification"
                  action={<Volume2 size={16} className="text-cyan-400" />}
                >
                  <label
                    htmlFor="buzzer-duration"
                    className="text-[10px] text-slate-400"
                  >
                    Sound duration (seconds)
                  </label>

                  <input
                    id="buzzer-duration"
                    type="number"
                    min="1"
                    max="30"
                    step="1"
                    value={buzzerSeconds}
                    onChange={(event) => setBuzzerSeconds(event.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-700 bg-[#0c151e] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-400"
                  />

                  <p className="mt-2 text-[9px] text-slate-500">
                    Allowed demonstration duration: 1–30 seconds.
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`text-[10px] ${buzzerActive ? 'text-amber-300' : 'text-slate-400'}`}>
                      {buzzerActive ? 'Demo buzzer active' : 'Demo buzzer idle'}
                    </span>

                    <ControlButton
                      variant="success"
                      onClick={startBuzzerDemo}
                      disabled={buzzerActive}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Volume2 size={12} />
                        SOUND
                      </span>
                    </ControlButton>
                  </div>

                  <p className="mt-3 text-[9px] leading-relaxed text-slate-500">
                    The ESP32 will eventually handle buzzer timing locally.
                  </p>
                </Panel>
              </div>
            </section>

            {/* THRESHOLD CONFIGURATION */}
            <section
              id="configuration"
              className="mt-5 scroll-mt-5"
            >
              <Panel
                title="Threshold configuration"
                subtitle="Illustrative warning and operating limits"
                action={
                  <Settings size={15} className="text-cyan-400" />
                }
              >
                <div className="mb-4 rounded-md border border-slate-700 bg-[#0c151e] p-3 text-[10px] leading-relaxed text-slate-400">
                  Configure the sample values below. Saving currently updates
                  the local interface only; the backend has not been connected.
                  Final limits must be validated against equipment ratings.
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label
                      htmlFor="temperature-threshold"
                      className="text-[10px] text-slate-400"
                    >
                      Temperature warning (°C)
                    </label>

                    <input
                      id="temperature-threshold"
                      type="number"
                      min="0"
                      value={temperatureThreshold}
                      onChange={(event) => {
                        setTemperatureThreshold(event.target.value);
                        setThresholdsSaved(false);
                      }}
                      className="mt-2 w-full rounded-md border border-slate-700 bg-[#0c151e] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vibration-threshold"
                      className="text-[10px] text-slate-400"
                    >
                      Vibration warning (g)
                    </label>

                    <input
                      id="vibration-threshold"
                      type="number"
                      min="0"
                      step="0.01"
                      value={vibrationThreshold}
                      onChange={(event) => {
                        setVibrationThreshold(event.target.value);
                        setThresholdsSaved(false);
                      }}
                      className="mt-2 w-full rounded-md border border-slate-700 bg-[#0c151e] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="voltage-high"
                      className="text-[10px] text-slate-400"
                    >
                      High voltage limit (V)
                    </label>

                    <input
                      id="voltage-high"
                      type="number"
                      min="0"
                      value={voltageHigh}
                      onChange={(event) => {
                        setVoltageHigh(event.target.value);
                        setThresholdsSaved(false);
                      }}
                      className="mt-2 w-full rounded-md border border-slate-700 bg-[#0c151e] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="voltage-low"
                      className="text-[10px] text-slate-400"
                    >
                      Low voltage limit (V)
                    </label>

                    <input
                      id="voltage-low"
                      type="number"
                      min="0"
                      value={voltageLow}
                      onChange={(event) => {
                        setVoltageLow(event.target.value);
                        setThresholdsSaved(false);
                      }}
                      className="mt-2 w-full rounded-md border border-slate-700 bg-[#0c151e] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-4">
                  <p className={`text-[10px] ${thresholdsSaved ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {thresholdsSaved
                      ? 'Demo settings saved in the interface.'
                      : 'Unsaved demonstration settings'}
                  </p>

                  <ControlButton
                    variant="success"
                    onClick={saveThresholdsDemo}
                  >
                    SAVE THRESHOLDS
                  </ControlButton>
                </div>
              </Panel>
            </section>

            {/* ALARMS AND EVENTS */}
            <section
              id="alarms-and-events"
              className="mt-5 scroll-mt-5"
            >
              <Panel
                title="Alarms & events"
                subtitle="Recent interface activity"
                action={
                  <Bell size={15} className="text-cyan-400" />
                }
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400">
                    Recent demonstration events
                  </p>

                  <button
                    type="button"
                    onClick={() => setAlarms([])}
                    className="text-[9px] text-slate-400 transition-colors hover:text-white"
                  >
                    Clear display
                  </button>
                </div>

                {alarms.length === 0 ? (
                  <p className="rounded-md border border-slate-700 bg-[#0c151e] p-4 text-[10px] text-slate-500">
                    No events displayed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className="flex flex-wrap items-start gap-3 rounded-md border border-slate-700/70 bg-[#0c151e] p-3"
                      >
                        <div className="mt-0.5">
                          {alarm.severity === 'INFO' ? (
                            <CheckCircle2
                              size={14}
                              className="text-cyan-400"
                            />
                          ) : (
                            <AlertTriangle
                              size={14}
                              className="text-amber-400"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-200">
                            {alarm.message}
                          </p>

                          <p className="mt-1 text-[9px] text-slate-500">
                            {alarm.time} · Demonstration event
                          </p>
                        </div>

                        <span className="rounded border border-slate-700 px-2 py-1 text-[8px] text-slate-400">
                          {alarm.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </section>

            {/* STATUS NOTICE */}
            <div className="mt-5 rounded-md border border-slate-700 bg-[#111b26] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500">
                Interface activity
              </p>

              <p className="mt-1 text-[10px] text-slate-300">
                {notice}
              </p>
            </div>

            {/* FOOTER */}
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-[9px] text-slate-500">
              <span>
                Industrial Energy Monitoring System · Prototype Dashboard
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Demonstration data
                <span>·</span>
                React + FastAPI + PostgreSQL architecture
              </span>
            </footer>
          </div>
        </main>
      </div>

      {/* MEASUREMENT DETAILS */}
      {selected && (
        <DetailModal
          key={selected.id}
          metricId={selected.id}
          title={selected.title}
          value={selected.value}
          unit={selected.unit}
          onClose={() => setSelectedMetric(null)}
        />
      )}

      {selectedMetric === 'powerFactor' && (
        <DetailModal
          key="powerFactor"
          metricId="powerFactor"
          title="Power Factor"
          value={0.94}
          unit="PF"
          onClose={() => setSelectedMetric(null)}
        />
      )}

      {selectedMetric === 'temperature' && (
        <DetailModal
          key="temperature"
          metricId="temperature"
          title={temperatureMetric.title}
          value={temperatureMetric.value}
          unit={temperatureMetric.unit}
          onClose={() => setSelectedMetric(null)}
        />
      )}

      {selectedMetric === 'vibration' && (
        <DetailModal
          key="vibration"
          metricId="vibration"
          title={vibrationMetric.title}
          value={vibrationMetric.value}
          unit={vibrationMetric.unit}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;