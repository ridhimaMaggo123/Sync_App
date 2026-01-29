import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000'
    const body = await request.json()
    
    const res = await fetch(`${backend}/api/analyze/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('Error saving analysis:', e)
    return NextResponse.json({ message: 'Failed to save analysis' }, { status: 500 })
  }
}

