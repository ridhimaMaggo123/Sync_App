import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000'
    const res = await fetch(`${backend}/api/cycle/history`, {
      headers: { Cookie: request.headers.get('cookie') || '' },
      credentials: 'include',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('Error fetching health history:', e)
    return NextResponse.json({ success: false, message: 'Failed to load health history' }, { status: 500 })
  }
}

