import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ code: 400, msg: 'URL is required' }, { status: 400 });
    }

    const apiUrl = `https://dl.caiths.com/api/create/shorturl?url=${encodeURIComponent(url)}`;
    
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZG8iLCJpYXQiOjE3Njk3NjM0NjYsImV4cCI6MTc2OTc5OTQ2Nn0.-fc9bqJPVJxmwKWMXgPYFb90yY1NM1GOj1kAIhZGH3Y';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://dl.caiths.com/index',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
      }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Short link error:', error);
    return NextResponse.json({ code: 500, msg: 'Internal Server Error' }, { status: 500 });
  }
}
