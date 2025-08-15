'use client';

import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { ChartData, ChartOptions } from 'chart.js';
import classNames from 'classnames';
import StatCard from '../components/StatCard';
import ThemeToggle from '../components/ThemeToggle';

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
  const [theme, setTheme] = useState<'night' | 'hacker' | 'darkness' | 'powder'>('night');
  const [timeframe, setTimeframe] = useState<'6h' | '24h' | '1w' | '1m'>('24h');

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

  const themeStyles = {
    // Deep night with cyan/indigo accents
    night: {
      background: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800',
      text: 'text-slate-100',
      time: 'text-slate-400',
      button: 'text-white',
      buttonBg: 'bg-slate-700/80',
      rangeBtnActive: 'bg-cyan-600 text-white shadow',
      rangeBtn: 'text-cyan-300 hover:text-cyan-100',
      chart: {
        borderColor: 'rgba(56,189,248,1)', // sky-400
        backgroundColor: 'rgba(56,189,248,0.18)',
        borderColorHumidity: 'rgba(129,140,248,1)', // indigo-400
        backgroundColorHumidity: 'rgba(129,140,248,0.18)',
        axisColor: '#94a3b8'
      }
    },
    // Matrix style refined green / lime accents
    hacker: {
      background: 'bg-gradient-to-br from-black via-zinc-900 to-black',
      text: 'text-emerald-200',
      time: 'text-emerald-500',
      button: 'text-black',
      buttonBg: 'bg-emerald-500',
      rangeBtnActive: 'bg-emerald-500 text-black shadow',
      rangeBtn: 'text-emerald-400 hover:text-emerald-200',
      chart: {
        borderColor: 'rgba(34,197,94,1)', // emerald-500
        backgroundColor: 'rgba(34,197,94,0.15)',
        borderColorHumidity: 'rgba(132,204,22,1)', // lime-500
        backgroundColorHumidity: 'rgba(132,204,22,0.18)',
        axisColor: '#16a34a'
      }
    },
    // Neutral graphite with amber & teal accents
    darkness: {
      background: 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700',
      text: 'text-neutral-100',
      time: 'text-neutral-400',
      button: 'text-neutral-100',
      buttonBg: 'bg-neutral-600',
      rangeBtnActive: 'bg-amber-600 text-white shadow',
      rangeBtn: 'text-amber-400 hover:text-amber-200',
      chart: {
        borderColor: 'rgba(245,158,11,1)', // amber-500
        backgroundColor: 'rgba(245,158,11,0.20)',
        borderColorHumidity: 'rgba(20,184,166,1)', // teal-500
        backgroundColorHumidity: 'rgba(20,184,166,0.22)',
        axisColor: '#d1d5db'
      }
    },
    // Ocean theme (replaces candy) with orange & cyan contrast
    powder: {
      background: 'bg-gradient-to-br from-cyan-900 via-cyan-800 to-slate-900',
      text: 'text-cyan-100',
      time: 'text-cyan-300',
      button: 'text-cyan-100',
      buttonBg: 'bg-cyan-700/70',
      rangeBtnActive: 'bg-orange-500 text-white shadow',
      rangeBtn: 'text-orange-300 hover:text-orange-200',
      chart: {
        borderColor: 'rgba(249,115,22,1)', // orange-500
        backgroundColor: 'rgba(249,115,22,0.22)',
        borderColorHumidity: 'rgba(14,165,233,1)', // sky-500
        backgroundColorHumidity: 'rgba(14,165,233,0.22)',
        axisColor: '#bae6fd'
      }
    }
  } as const;

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
      { label: 'Temperatura (°C)', data: filteredData.map(d => d.temperature), borderColor: themeStyles[theme].chart.borderColor, backgroundColor: themeStyles[theme].chart.backgroundColor, fill: true, tension: 0.35, pointRadius: 0, yAxisID: 'y' },
      { label: 'Wilgotność (%)', data: filteredData.map(d => d.humidity), borderColor: themeStyles[theme].chart.borderColorHumidity, backgroundColor: themeStyles[theme].chart.backgroundColorHumidity, fill: true, tension: 0.35, pointRadius: 0, yAxisID: 'y1' },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: themeStyles[theme].chart.axisColor }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { type: 'linear', display: true, position: 'left', ticks: { color: themeStyles[theme].chart.axisColor }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: themeStyles[theme].chart.axisColor } },
    },
    plugins: { legend: { labels: { color: themeStyles[theme].chart.axisColor } }, tooltip: { callbacks: { label: t => `${t.dataset.label}: ${t.raw}` } } },
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 500 },
  };

  const handleThemeChange = () => {
    setTheme(prev => prev === 'night' ? 'hacker' : prev === 'hacker' ? 'darkness' : prev === 'darkness' ? 'powder' : 'night');
  };

  const timeframeButtons: { id: typeof timeframe; label: string }[] = [
    { id: '6h', label: '6h' },
    { id: '24h', label: '24h' },
    { id: '1w', label: '1 tydzień' },
    { id: '1m', label: '1 miesiąc' },
  ];

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!latestData || !pastResults.length) {
    return (
      <div className={`flex h-[100dvh] w-full flex-col justify-center items-center px-6 text-center ${themeStyles[theme].background}`}>
        <div className='loader mb-6' />
        <p className={`${themeStyles[theme].text} text-lg font-medium`}>Wczytywanie danych czujnika...</p>
        <p className={`${themeStyles[theme].time} text-xs mt-2`}>Łączenie z serwerem i pobieranie ostatnich pomiarów.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col ${themeStyles[theme].background} text-white relative`}>
      <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 gap-4 relative z-10">
        <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${themeStyles[theme].text}`}>DataRoom</h1>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex text-xs opacity-70">ESP32 Monitor</div>
          <ThemeToggle theme={theme} onChange={handleThemeChange} />
        </div>
      </header>
      <main className="flex-1 relative z-10 px-4 sm:px-8 pb-24 safe-pb w-full mx-auto max-w-7xl flex flex-col gap-6">
        <div className="w-full grid md:grid-cols-4 sm:grid-cols-2 grid-cols-2 gap-3 md:gap-4">
          <StatCard label="Temp" value={latestData?.temperature?.toFixed?.(1)} unit="°C" highlightColor={themeStyles[theme].chart.borderColor} small />
          <StatCard label="Wilgotność" value={latestData?.humidity?.toFixed?.(1)} unit="%" highlightColor={themeStyles[theme].chart.borderColorHumidity} small />
          <StatCard label="Ostatni pomiar" value={minutesAgo ?? '—'} highlightColor={themeStyles[theme].chart.axisColor} small />
          <StatCard label="Próbek" value={filteredData.length} small />
        </div>
        <section className="glass fade-in p-4 sm:p-6 flex flex-col gap-4 h-[55vh] md:h-[60vh]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Historia pomiarów</h2>
              <p className="text-xs opacity-70">Interaktywne wykresy temperatury i wilgotności</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
              {timeframeButtons.map(btn => (
                <button key={btn.id} onClick={() => setTimeframe(btn.id)} className={classNames('px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200', btn.id === timeframe ? themeStyles[theme].rangeBtnActive : themeStyles[theme].rangeBtn)}>
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
            theme === 'night' && 'bg-indigo-700/70 hover:bg-indigo-600/80 text-white border-white/10 focus:ring-indigo-400/40',
            theme === 'hacker' && 'bg-[#00ff00]/20 hover:bg-[#00ff00]/30 text-[#00ff00] border-[#00ff00]/40 focus:ring-[#00ff00]/40',
            theme === 'darkness' && 'bg-gray-600/40 hover:bg-gray-500/50 text-white border-white/10 focus:ring-gray-300/40',
            theme === 'powder' && 'bg-white/70 hover:bg-white text-pink-600 border-pink-300/60 focus:ring-pink-300/60'
          )}
          aria-label="GitHub Fernando"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.93c.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.3-1.68-1.3-1.68-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.99 0 1.99.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.42.36.79 1.07.79 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <p className={`text-[10px] sm:text-xs opacity-60 ${themeStyles[theme].text}`}>Aplikacja • Fernando</p>
      </div>
    </div>
  );
}
