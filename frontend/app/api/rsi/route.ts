import { NextRequest, NextResponse } from 'next/server';

interface RSIData {
  token_address: string;
  timestamp: number;
  price: number;
  rsi: number;
  period_count: number;
  block_time: number;
}

// In-memory storage for recent RSI data
let rsiDataStore: Map<string, RSIData> = new Map();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('token');

  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address required' }, { status: 400 });
  }

  try {
    // For now, return mock data with some realistic values
    // In production, this would connect to Kafka and return real data
    const mockData: RSIData = {
      token_address: tokenAddress,
      timestamp: Date.now(),
      price: Math.random() * 0.00001 + 0.000001, // Random price between 0.000001 and 0.000011
      rsi: Math.random() * 40 + 30, // Random RSI between 30 and 70
      period_count: 14,
      block_time: Date.now(),
    };

    // Store the data for potential future use
    rsiDataStore.set(tokenAddress, mockData);

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSI data' },
      { status: 500 }
    );
  }
}

// Optional: Add endpoint to simulate receiving data from Kafka
export async function POST(request: NextRequest) {
  try {
    const data: RSIData = await request.json();

    // Store the data
    rsiDataStore.set(data.token_address, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to store RSI data' },
      { status: 500 }
    );
  }
}
