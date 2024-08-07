import connectToDatabase from '../../../lib/mongodb';
import Data from '../../../models/Data';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();

  try {
    const data = await Data.find().sort({ createdAt: -1 }).limit(1);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
