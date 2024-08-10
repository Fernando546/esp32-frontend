import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const subscription = await request.json();
    console.log('Received subscription:', subscription);
    return NextResponse.json('Subscription received');
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json('Error saving subscription', { status: 500 });
  }
}
