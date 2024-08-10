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
  

  if (error) return <div>{error}</div>;
  if (!latestData || !past48Results.length) {
    return (
      <div className='flex h-screen w-full flex-col justify-center items-center bg-gradient-to-br from-slate-900 to-indigo-900'>
        <div className='loader'></div>
        <p className='text-white text-lg mt-4 font-bold'>Wczytywanie, proszę czekać...</p>
      </div>
    );
  }

  const chartData: ChartData<'line'> = {
    labels: past48Results.map(d => {
      const date = new Date(d.createdAt);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: past48Results.map(d => d.temperature),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Humidity (%)',
        data: past48Results.map(d => d.humidity),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
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
          color: '#94a3b8', // Kolor godzin na osi X
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: '#94a3b8', // Kolor wartości na osi Y
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
          color: '#94a3b8', // Kolor wartości na osi Y1
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', // Kolor etykiet legendy
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

  return (
    <div className='flex h-[100dvh] w-full flex-col justify-center items-center bg-gradient-to-br from-slate-900 to-indigo-900 overflow-hidden'>
      <div className='flex justify-center items-center flex-col text-white'>
        <h1 className='text-4xl md:text-5xl p-10 text-center font-bold'>Temperatura i wilgotność w pomieszczeniu</h1>
        <p className='font-semibold pb-5 text-lg'>
          <span className='text-white'>Temperatura:</span> 
          <span style={{ color: 'rgba(75, 192, 192, 1)' }}> {latestData?.temperature}°C</span>
        </p>
        <p className='font-semibold pb-5 text-lg'>
          <span className='text-white'>Wilgotność:</span> 
          <span style={{ color: 'rgba(153, 102, 255, 1)' }}> {latestData?.humidity}%</span>
        </p>
        <p className='font-semibold text-lg'>
          <span className='text-white'>Ostatni pomiar: </span>
          <span className='text-slate-400'>{minutesAgo}</span>
        </p>
        <div className='w-full max-w-4xl p-5'>
          <Line data={chartData} options={options} />
        </div>
      </div>
      <div className='fixed bottom-0 w-full flex justify-center'>
        <p className='p-5 text-white text-xs md:text-sm text-center'>
          Aplikacja wykonana z miłością przez Fernanda.
          <a href="https://github.com/Fernando546" className='text-indigo-300 font-bold' target='_blank' rel='noopener noreferrer'> GitHub</a>
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
