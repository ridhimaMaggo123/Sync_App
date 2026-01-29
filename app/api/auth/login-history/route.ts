import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000'
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '50'
    const skip = searchParams.get('skip') || '0'
    
    const res = await fetch(`${backend}/api/auth/login-history?limit=${limit}&skip=${skip}`, {
      headers: { Cookie: request.headers.get('cookie') || '' },
      credentials: 'include',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('Error fetching login history:', e)
    return NextResponse.json({ success: false, message: 'Failed to load login history' }, { status: 500 })
  }
}

