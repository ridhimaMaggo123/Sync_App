import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    
    // Use the progress-pdf endpoint which generates comprehensive reports
    const response = await fetch(`${backendUrl}/api/report/progress-pdf`, {
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    })

    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText)
      return NextResponse.json(
        { message: 'Failed to generate report' },
        { status: response.status }
      )
    }

    // Get the PDF buffer from the backend
    const pdfBuffer = await response.arrayBuffer()
    
    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sync-health-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

