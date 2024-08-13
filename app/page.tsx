'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface IData {
  temperature: number;
  humidity: number;
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [latestData, setLatestData] = useState<IData | null>(null);
  const [past48Results, setPast48Results] = useState<IData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [minutesAgo, setMinutesAgo] = useState<string | null>(null);
  const [theme, setTheme] = useState<'night' | 'hacker' | 'darkness' | 'powder'>('night');

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching data...');
        const res = await fetch('/api/data', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const result = await res.json();
        console.log('Data fetched:', result);
        setLatestData(result.latestData);
        setPast48Results(result.past48Results.reverse());

        if (result.latestData) {
          const now = new Date();
          const lastMeasurementTime = new Date(result.latestData.createdAt);
          const diffInMinutes = Math.floor((now.getTime() - lastMeasurementTime.getTime()) / (1000 * 60));
          setMinutesAgo(diffInMinutes + 'min temu');
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
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
          console.log('Notification permission granted.');
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          
          if (!vapidPublicKey) {
            throw new Error('VAPID Public Key is missing');
          }
  
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
          
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
          });
        } else {
          console.log('Notification permission denied.');
        }
      }
    }
  
    setupPushNotifications();
  }, []);

  const themeStyles = {
    night: {
      background: 'bg-gradient-to-br from-slate-900 to-indigo-900',
      text: 'text-white',
      time: 'text-slate-400',
      button: 'text-white',
      buttonBg: 'bg-indigo-700',
      chart: {
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColorHumidity: 'rgba(153, 102, 255, 1)',
        backgroundColorHumidity: 'rgba(153, 102, 255, 0.2)',
        axisColor: '#94a3b8',
      }
    },
    hacker: {
      background: 'bg-black',
      text: 'text-[#0f0]',
      time: 'text-[#0f0]',
      button: 'text-black',
      buttonBg: 'bg-[#0f0]',
      chart: {
        borderColor: 'rgba(0, 255, 0, 1)',
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        borderColorHumidity: 'rgba(0, 255, 0, 1)',
        backgroundColorHumidity: 'rgba(0, 255, 0, 0.2)',
        axisColor: '#0f0',
      }
    },
    darkness: {
      background: 'bg-gradient-to-r from-slate-900 to-slate-700',
      text: 'text-white',
      time: 'text-gray-400',
      button: 'text-white',
      buttonBg: 'bg-[#1f2937]',
      chart: {
        borderColor: 'rgba(222, 222, 222, 1)',
        backgroundColor: 'rgba(222, 222, 222, 0.2)',
        borderColorHumidity: 'rgba(130, 130, 130, 1)',
        backgroundColorHumidity: 'rgba(130, 130, 130, 0.2)',
        axisColor: '#ccc',
      }
    },
    powder: {
      background: 'bg-gradient-to-r from-violet-200 to-pink-200',
      text: 'text-pink-500',
      time: 'text-natural-400',
      button: 'text-pink-500',
      buttonBg: 'b-whiteg',
      chart: {
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColorHumidity: 'rgba(54, 162, 235, 1)',
        backgroundColorHumidity: 'rgba(54, 162, 235, 0.2)',
        axisColor: '#1db4ec',
      }
    }
  };

  const chartData: ChartData<'line'> = {
    labels: past48Results.map(d => {
      const date = new Date(d.createdAt);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: past48Results.map(d => d.temperature),
        borderColor: themeStyles[theme].chart.borderColor,
        backgroundColor: themeStyles[theme].chart.backgroundColor,
        yAxisID: 'y',
      },
      {
        label: 'Humidity (%)',
        data: past48Results.map(d => d.humidity),
        borderColor: themeStyles[theme].chart.borderColorHumidity,
        backgroundColor: themeStyles[theme].chart.backgroundColorHumidity,
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: themeStyles[theme].chart.axisColor, // Color for X-axis labels
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: themeStyles[theme].chart.axisColor, // Color for Y-axis labels
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: themeStyles[theme].chart.axisColor, // Color for Y1-axis labels
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: themeStyles[theme].chart.axisColor, // Color for legend labels
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
  };

  const handleThemeChange = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'night') return 'hacker';
      if (prevTheme === 'hacker') return 'darkness';
      if (prevTheme === 'darkness') return 'powder';
      return 'night'; 
    });
  };

  if (error) return <div>{error}</div>;
  if (!latestData || !past48Results.length) {
    return (
      <div className={`flex h-screen w-full flex-col justify-center items-center ${themeStyles[theme].background}`}>
        <div className='loader'></div>
        <p className={`${themeStyles[theme].text} text-lg mt-4 font-bold`}>Wczytywanie, proszę czekać...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] w-full flex-col justify-center items-center ${themeStyles[theme].background} overflow-hidden`}>
      <div className='fixed top-0 right-0 m-5'>
          <button onClick={handleThemeChange} className={`text-sm font-bold py-2 px-3 bg-white rounded-md ${themeStyles[theme].button} ${themeStyles[theme].buttonBg} mb-4`}>
            {theme === 'night' ? 'Motyw: Noc' : theme === 'hacker' ? 'Motyw: Haker' : theme === 'darkness' ? 'Motyw: Ciemny' : 'Motyw: Cukrowy'}
          </button>
        </div>
      <div className='flex justify-center items-center flex-col'>
        <h1 className={`text-4xl md:text-5xl p-10 text-center font-bold ${themeStyles[theme].text}`}>Temperatura i wilgotność w pomieszczeniu</h1>
        <p className={`font-semibold pb-5 text-lg ${themeStyles[theme].text}`}>
          <span className={`${themeStyles[theme].text}`}>Temperatura:</span> 
          <span style={{ color: themeStyles[theme].chart.borderColor }}> {latestData?.temperature}°C</span>
        </p>
        <p className={`font-semibold pb-5 text-lg ${themeStyles[theme].text}`}>
          <span className={`${themeStyles[theme].text}`}>Wilgotność:</span> 
          <span style={{ color: themeStyles[theme].chart.borderColorHumidity }}> {latestData?.humidity}%</span>
        </p>
        <p className={`font-semibold text-lg ${themeStyles[theme].text}`}>
          <span className={`${themeStyles[theme].text}`}>Ostatni pomiar: </span>
          <span className={`${themeStyles[theme].time}`}>{minutesAgo}</span>
        </p>
        <div className='w-full max-w-4xl p-5'>
          <Line data={chartData} options={options} />
        </div>
      </div>
      <div className='fixed bottom-0 w-full flex justify-center'>
        <p className={`p-5 text-xs md:text-sm text-center ${themeStyles[theme].text}`}>
          Aplikacja wykonana z miłością przez Fernanda.
          <a href="https://github.com/Fernando546" className='font-bold' target='_blank' rel='noopener noreferrer'> GitHub</a>
        </p>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) {
    throw new Error('Base64 string is undefined or empty');
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
