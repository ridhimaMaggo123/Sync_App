import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000'
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || null
    const endDate = searchParams.get('endDate') || null
    
    let url = `${backend}/api/activity/statistics`
    if (startDate) url += `?startDate=${startDate}`
    if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`
    
    const res = await fetch(url, {
      headers: { Cookie: request.headers.get('cookie') || '' },
      credentials: 'include',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('Error fetching activity statistics:', e)
    return NextResponse.json({ success: false, message: 'Failed to load activity statistics' }, { status: 500 })
  }
}

