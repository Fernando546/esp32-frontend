'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

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
        setPast48Results(result.past48Results.reverse()); // Reverse to display from oldest to newest
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data');
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div>{error}</div>;
  if (!latestData || !past48Results.length) return <div>Loading...</div>;

  const chartData = {
    labels: past48Results.map(d => new Date(d.createdAt).toLocaleTimeString()),
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className='flex h-screen w-full flex-col justify-center items-center bg-gradient-to-br from-slate-900 to-indigo-900'>
      <div className='flex justify-center items-center flex-col text-white'>
        <h1 className='text-5xl p-10 text-center font-bold'>Temperatura i wilgotność w pokoju</h1>
        <p className='font-semibold pb-5 text-lg'>Temperatura: {latestData.temperature}°C</p>
        <p className='font-semibold text-lg'>Wilgotność: {latestData.humidity}%</p>
        <div className='w-full max-w-4xl p-5'>
          <Line data={chartData} options={options} />
        </div>
      </div>
      <div className='fixed bottom-0 w-full flex justify-center'>
        <p className='p-5 text-white text-xs md:text-sm text-center'>Aplikacja wykonana z miłością przez Fernanda</p>
      </div>
    </div>
  );
}
