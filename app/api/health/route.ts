import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'AiBooker',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 10)}...` : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      AUTH_SECRET: process.env.AUTH_SECRET ? 'SET' : 'NOT SET',
      AUTH_URL: process.env.AUTH_URL || 'NOT SET',
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    },
  });
}
