"use client";

import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { ChartData, ChartOptions } from 'chart.js';
import classNames from 'classnames';
import StatCard from '../components/StatCard';
import TemperatureEffect from '../components/TemperatureEffect';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface IData {
  temperature: number;
  humidity: number;
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [latestData, setLatestData] = useState<IData | null>(null);
  const [pastResults, setPastResults] = useState<IData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [minutesAgo, setMinutesAgo] = useState<string | null>(null);
  const [baseTheme, setBaseTheme] = useState<'night' | 'day'>('night');
  const [timeframe, setTimeframe] = useState<'6h' | '24h' | '1w' | '1m'>('24h');
  // Rain removed

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) throw new Error('Base64 string missing');
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        if (!res.ok) throw new Error('Network response was not ok');
        const result = await res.json();
        setLatestData(result.latestData);
        setPastResults(result.past48Results.reverse());
        if (result.latestData) {
          const now = new Date();
            const lastMeasurementTime = new Date(result.latestData.createdAt);
            const diffInMinutes = Math.floor((now.getTime() - lastMeasurementTime.getTime()) / (1000 * 60));
            setMinutesAgo(diffInMinutes + 'min temu');
        }
      } catch (e: any) {
        setError('Failed to fetch data');
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function setupPushNotifications() {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) return;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
          });
          await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });
        }
      }
    }
    setupPushNotifications();
  }, []);

  // Follow system theme (day/light vs night/dark)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setBaseTheme(mq.matches ? 'night' : 'day');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Temperature accent selection
  const temperature = latestData?.temperature ?? 20;
  type AccentKey = 'cold' | 'normal' | 'warm' | 'hot';
  let accentKey: AccentKey = 'normal';
  // thresholds per user: hot >30, warm 25-30, normal 18-25, cold <18
  if (temperature < 18) accentKey = 'cold';
  else if (temperature > 30) accentKey = 'hot';
  else if (temperature > 25) accentKey = 'warm';

  const accentPalettes: Record<AccentKey, {
    color: string; fill: string; // temperature (primary) dataset
    humidityColor: string; humidityFill: string; // humidity dataset variant also tied to temperature
    darkBg: string; lightBg: string; // background gradients
  }> = {
    cold: {
      color: '#3b82f6', fill: 'rgba(59,130,246,0.18)',
      humidityColor: '#0ea5e9', humidityFill: 'rgba(14,165,233,0.20)',
      darkBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950',
      lightBg: 'bg-gradient-to-br from-sky-100 via-blue-50 to-white'
    },
    normal: {
      color: '#10b981', fill: 'rgba(16,185,129,0.20)',
      humidityColor: '#34d399', humidityFill: 'rgba(52,211,153,0.18)',
      darkBg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900',
      lightBg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-white'
    },
    warm: {
      color: '#f59e0b', fill: 'rgba(245,158,11,0.22)',
      humidityColor: '#fbbf24', humidityFill: 'rgba(251,191,36,0.22)',
      darkBg: 'bg-gradient-to-br from-stone-950 via-amber-900 to-stone-800',
      lightBg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-white'
    },
    hot: {
      color: '#ef4444', fill: 'rgba(239,68,68,0.25)',
      humidityColor: '#fb7185', humidityFill: 'rgba(251,113,133,0.25)',
      darkBg: 'bg-gradient-to-br from-black via-rose-950 to-neutral-900',
      lightBg: 'bg-gradient-to-br from-rose-50 via-red-50 to-white'
    },
  };
  const accent = accentPalettes[accentKey];

  const themeStyles = useMemo(() => {
    const dark = baseTheme === 'night';
    return {
  background: dark ? accent.darkBg : accent.lightBg,
      text: dark ? 'text-slate-100' : 'text-slate-800',
      time: dark ? 'text-slate-400' : 'text-slate-500',
      rangeBtn: dark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900',
      rangeBtnActive: 'text-white shadow',
      axis: dark ? '#94a3b8' : '#475569',
      chart: {
        borderColor: accent.color,
        backgroundColor: accent.fill,
  borderColorHumidity: accent.humidityColor,
  backgroundColorHumidity: accent.humidityFill,
        axisColor: dark ? '#94a3b8' : '#475569',
      },
      accentColor: accent.color,
      glassOverlay: dark ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_60%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.08),transparent_60%)]',
      buttonFrame: dark ? 'bg-white/5 border-white/10' : 'bg-slate-200/70 border-slate-300/60'
    };
  }, [baseTheme, accent.color, accent.fill]);

  const filteredData = useMemo(() => {
    let samplesNeeded: number;
    switch (timeframe) {
      case '6h': samplesNeeded = 6 * 2; break;
      case '24h': samplesNeeded = 24 * 2; break;
      case '1w': samplesNeeded = 7 * 24 * 2; break;
      case '1m': samplesNeeded = 30 * 24 * 2; break;
      default: samplesNeeded = 48;
    }
    const arr = [...pastResults];
    return arr.slice(-samplesNeeded);
  }, [pastResults, timeframe]);

  const chartData: ChartData<'line'> = {
    labels: filteredData.map(d => {
      const date = new Date(d.createdAt);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
  { label: 'Temperatura (°C)', data: filteredData.map(d => d.temperature), borderColor: themeStyles.chart.borderColor, backgroundColor: themeStyles.chart.backgroundColor, fill: true, tension: 0.35, pointRadius: 0, yAxisID: 'y' },
  { label: 'Wilgotność (%)', data: filteredData.map(d => d.humidity), borderColor: themeStyles.chart.borderColorHumidity, backgroundColor: themeStyles.chart.backgroundColorHumidity, fill: true, tension: 0.35, pointRadius: 0, yAxisID: 'y1' },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: themeStyles.chart.axisColor }, grid: { color: 'rgba(128,128,128,0.15)' } },
      y: { type: 'linear', display: true, position: 'left', ticks: { color: themeStyles.chart.axisColor }, grid: { color: 'rgba(128,128,128,0.15)' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: themeStyles.chart.axisColor } },
    },
    plugins: { legend: { labels: { color: themeStyles.chart.axisColor } }, tooltip: { callbacks: { label: t => `${t.dataset.label}: ${t.raw}` } } },
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 500 },
  };

  // Automatic system theme; no manual toggle.

  const timeframeButtons: { id: typeof timeframe; label: string }[] = [
    { id: '6h', label: '6h' },
    { id: '24h', label: '24h' },
    { id: '1w', label: '1 tydzień' },
    { id: '1m', label: '1 miesiąc' },
  ];

  // Rain removed – humidity only displayed in stats
  const humidity = latestData?.humidity ?? 0;

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!latestData || !pastResults.length) {
    return (
      <div className={`flex h-[100dvh] w-full flex-col justify-center items-center px-6 text-center ${themeStyles.background} ${baseTheme === 'day' ? 'text-slate-800' : 'text-white'}`}>
        <div className='loader mb-6' />
        <p className={`${themeStyles.text} text-lg font-medium`}>Wczytywanie danych czujnika...</p>
        <p className={`${themeStyles.time} text-xs mt-2`}>Łączenie z serwerem i pobieranie ostatnich pomiarów.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col ${themeStyles.background} relative ${baseTheme === 'day' ? 'text-slate-800' : 'text-white'}`}>
      <div className={`absolute inset-0 opacity-25 pointer-events-none ${themeStyles.glassOverlay}`} />
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 gap-4 relative z-10">
        <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${themeStyles.text}`}>DataRoom</h1>
        <div className="flex items-center gap-3 text-xs opacity-70">ESP32 Monitor</div>
      </header>
  {/* Ambient temperature overlay */}
  <TemperatureEffect accent={accentKey} theme={baseTheme} />
      <main className="flex-1 relative z-10 px-4 sm:px-8 pb-24 safe-pb w-full mx-auto max-w-7xl flex flex-col gap-6">
        <div className="w-full grid md:grid-cols-4 sm:grid-cols-2 grid-cols-2 gap-3 md:gap-4">
          <StatCard label="Temp" value={latestData?.temperature?.toFixed?.(1)} unit="°C" highlightColor={themeStyles.chart.borderColor} small />
          <StatCard label="Wilgotność" value={latestData?.humidity?.toFixed?.(1)} unit="%" highlightColor={themeStyles.chart.borderColorHumidity} small />
          <StatCard label="Ostatni pomiar" value={minutesAgo ?? '—'} highlightColor={themeStyles.chart.axisColor} small />
          <StatCard label="Próbek" value={filteredData.length} small />
        </div>
        <section className="glass fade-in p-4 sm:p-6 flex flex-col gap-4 h-[55vh] md:h-[60vh]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Historia pomiarów</h2>
              <p className="text-xs opacity-70">Interaktywne wykresy temperatury i wilgotności</p>
            </div>
            <div className={`flex items-center gap-2 rounded-full p-1 border ${themeStyles.buttonFrame}`}>
              {timeframeButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setTimeframe(btn.id)}
                  className={classNames('px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200', btn.id === timeframe ? themeStyles.rangeBtnActive : themeStyles.rangeBtn)}
                  style={btn.id === timeframe ? { backgroundColor: themeStyles.accentColor } : undefined}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 relative">
            <Line data={chartData} options={options} />
          </div>
        </section>
      </main>
      <div className="fixed bottom-3 right-3 z-20 flex flex-col items-end gap-2">
        <a
          href="https://github.com/Fernando546"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
            baseTheme === 'night'
              ? 'bg-slate-700/70 hover:bg-slate-600/80 text-white border-white/10 focus:ring-slate-400/40'
              : 'bg-white/80 hover:bg-white text-slate-800 border-slate-300/70 focus:ring-slate-300/60'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.93c.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.3-1.68-1.3-1.68-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.99 0 1.99.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.42.36.79 1.07.79 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <p className={`text-[10px] sm:text-xs opacity-60 ${themeStyles.text}`}>Aplikacja • Fernando</p>
      </div>
    </div>
  );
}
