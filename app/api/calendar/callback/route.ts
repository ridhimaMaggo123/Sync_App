import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect('/integrations?calendar=error');
    }

    if (!code) {
      return NextResponse.redirect('/integrations?calendar=error');
    }

    // Forward the code to backend
    const response = await fetch(`${backendUrl}/api/calendar/callback?code=${code}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (response.ok || response.redirected) {
      // Backend will redirect, but we handle it here
      return NextResponse.redirect('/integrations?calendar=connected');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend callback error:', errorData);
      return NextResponse.redirect('/integrations?calendar=error');
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    return NextResponse.redirect('/integrations?calendar=error');
  }
}

