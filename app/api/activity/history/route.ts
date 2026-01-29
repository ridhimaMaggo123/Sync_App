import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000'
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '100'
    const skip = searchParams.get('skip') || '0'
    const activityType = searchParams.get('activityType') || null
    
    const url = `${backend}/api/activity/history?limit=${limit}&skip=${skip}${activityType ? `&activityType=${activityType}` : ''}`
    
    const res = await fetch(url, {
      headers: { Cookie: request.headers.get('cookie') || '' },
      credentials: 'include',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('Error fetching activity history:', e)
    return NextResponse.json({ success: false, message: 'Failed to load activity history' }, { status: 500 })
  }
}

