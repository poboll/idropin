import { NextRequest, NextResponse } from 'next/server';

/**
 * 短链接生成 API
 * 将任务链接 /task/XXX 转换为更短的 /t/XXX 格式
 * 如果不是任务链接，则原样返回
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ code: 400, msg: 'URL is required' }, { status: 400 });
    }

    // 解析 URL，提取 origin 和 path
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ code: 400, msg: 'Invalid URL' }, { status: 400 });
    }

    const pathname = parsedUrl.pathname;

    // 将 /task/XXX 转换为 /t/XXX
    const taskMatch = pathname.match(/^\/task\/([A-Za-z0-9]+)$/);
    if (taskMatch) {
      const shortUrl = `${parsedUrl.origin}/t/${taskMatch[1]}`;
      return NextResponse.json({ code: 0, data: { url: shortUrl } });
    }

    // 非任务链接，原样返回
    return NextResponse.json({ code: 0, data: { url } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Short link error:', error);
    return NextResponse.json({ code: 500, msg }, { status: 500 });
  }
}
