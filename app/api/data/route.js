import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import DataModel from '../../../models/Data';

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  cachedDb = client.connection.db;

  return { client, db: cachedDb };
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    console.log('Received data:', data);
    const newData = new DataModel(data);
    await newData.save();
    return NextResponse.json('Data saved');
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json('Error saving data', { status: 500 });
  }
}

export async function GET() {
  await connectToDatabase();

  try {
    const past48Results = await DataModel.find().sort({ createdAt: -1 }).limit(48);
    const latestData = past48Results[0];

    return NextResponse.json({ latestData, past48Results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
