import { NextRequest, NextResponse } from 'next/server';

const SHORT_LINK_BASE = 'https://dl.caiths.com';
const SHORT_LINK_API = `${SHORT_LINK_BASE}/api`;
const SHORT_LINK_USERNAME = process.env.SHORT_LINK_USERNAME || 'mdo';
const SHORT_LINK_PASSWORD = process.env.SHORT_LINK_PASSWORD || '123';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const loginResponse = await fetch(`${SHORT_LINK_API}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: SHORT_LINK_USERNAME, password: SHORT_LINK_PASSWORD }),
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate with short link service');
  }

  const loginData = await loginResponse.json();

  // API returns { code: 200, jwt: "..." }
  const token = loginData.jwt;
  if (!token) {
    throw new Error(loginData.msg || 'Authentication failed: no jwt in response');
  }

  try {
    const [, payloadBase64] = token.split('.');
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    cachedToken = { token, expiresAt: payload.exp * 1000 };
  } catch {
    cachedToken = { token, expiresAt: Date.now() + 60 * 60 * 1000 };
  }

  return token;
}

async function createShortUrl(url: string, token: string): Promise<string> {
  // API uses GET with query param
  const apiUrl = `${SHORT_LINK_API}/create/shorturl?url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (data.code !== 0 || !data.data?.random_url) {
    throw new Error(data.msg || 'Failed to create short link');
  }

  // 确保返回格式为 u.caiths.com/XX (两位数字)
  const randomUrl = data.data.random_url;
  return `https://u.caiths.com/${randomUrl}`;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ code: 400, msg: 'URL is required' }, { status: 400 });
    }

    let token = await getToken();

    try {
      const shortUrl = await createShortUrl(url, token);
      return NextResponse.json({ code: 0, data: { url: shortUrl } });
    } catch {
      // Token might be expired, retry with fresh token
      cachedToken = null;
      token = await getToken();
      const shortUrl = await createShortUrl(url, token);
      return NextResponse.json({ code: 0, data: { url: shortUrl } });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Short link error:', error);
    return NextResponse.json({ code: 500, msg }, { status: 500 });
  }
}
