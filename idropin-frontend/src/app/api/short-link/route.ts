import { NextRequest, NextResponse } from 'next/server';

// Short link service configuration
const SHORT_LINK_API = 'https://dl.caiths.com/api';
const SHORT_LINK_USERNAME = process.env.SHORT_LINK_USERNAME || 'mdo';
const SHORT_LINK_PASSWORD = process.env.SHORT_LINK_PASSWORD || '123';

// Cache for token with expiration
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  // Check if we have a valid cached token (with 5 minute buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  // Login to get a new token
  const loginResponse = await fetch(`${SHORT_LINK_API}/api/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
    },
    body: JSON.stringify({
      username: SHORT_LINK_USERNAME,
      password: SHORT_LINK_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate with short link service');
  }

  const loginData = await loginResponse.json();
  
  if (loginData.code !== 0 || !loginData.data?.token) {
    throw new Error(loginData.msg || 'Authentication failed');
  }

  const token = loginData.data.token;
  
  // Parse token to get expiration (JWT format)
  try {
    const [, payloadBase64] = token.split('.');
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
    const payloadJson = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    cachedToken = {
      token,
      expiresAt: payload.exp * 1000, // Convert to milliseconds
    };
  } catch (err) {
    console.warn('Failed to parse token exp, fallback cache 1h', err);
    // If we can't parse expiration, cache for 1 hour
    cachedToken = {
      token,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  }

  return token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ code: 400, msg: 'URL is required' }, { status: 400 });
    }

    // Get a valid token
    const token = await getToken();

    const apiUrl = `${SHORT_LINK_API}/create/shorturl?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (data.code !== 0) {
      // Token might be invalid, clear cache and retry once
      cachedToken = null;
      const newToken = await getToken();
      
      const retryResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${newToken}`,
        },
      });
      
      const retryData = await retryResponse.json();
      return NextResponse.json(retryData);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Short link error:', error);
    return NextResponse.json({ code: 500, msg: 'Internal Server Error' }, { status: 500 });
  }
}
