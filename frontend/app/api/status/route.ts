import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This is a placeholder API route
    // In a production environment, you might want to implement
    // server-side Kafka consumer logic here

    return NextResponse.json({
      status: 'ok',
      message: 'Dashboard API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
