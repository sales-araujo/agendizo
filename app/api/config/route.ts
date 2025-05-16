import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    resendApiKey: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
  })
} 