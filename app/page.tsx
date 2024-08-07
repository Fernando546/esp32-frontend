'use client';

import { useEffect, useState } from 'react';

interface IData {
  temperature: number;
  humidity: number;
}

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [data, setData] = useState<IData | null>(null);
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
        setData(result[0]);
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
  if (!data) return <div>Loading...</div>;

  return (
    <div className='flex h-screen w-full flex-col justify-center items-center bg-gradient-to-br from-slate-900 to-indigo-900'>
      <div className='flex justify-center items-center flex-col text-white'>
        <h1 className='text-5xl p-10 text-center font-bold'>Temperatura i wilgotność w pokoju</h1>
        <p className='font-semibold pb-5 text-lg'>Temperatura: {data.temperature}°C</p>
        <p className='font-semibold text-lg'>Wilgotność: {data.humidity}%</p>
      </div>
      <div className='fixed bottom-0 right-0'>
        <p className='pr-5 text-white text-xs md:text-sm text-center'>Aplikacja wykonana z miłością przez Fernanda</p>
        <p className='pb-5 pr-5 text-white text-xs md:text-sm text-center'>Pozdrawiam Mamę</p>
      </div>
    </div>
  );
}
