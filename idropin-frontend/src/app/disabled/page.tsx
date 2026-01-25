'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Ban, Home, HelpCircle } from 'lucide-react';
import { Suspense } from 'react';

function DisabledContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get('title') || '此功能';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-cyan-600 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md">
        <div className="mb-8">
          <Ban className="w-24 h-24 mx-auto text-white/80 stroke-1" />
        </div>
        
        <h1 className="text-4xl font-light mb-4">Idrop.in | 云集</h1>
        
        <h2 className="text-2xl font-light mb-6 text-white/90">
          {title}：已被网站管理员禁用
        </h2>
        
        <div className="space-y-4">
          <Link 
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white border border-white/20"
          >
            <HelpCircle className="w-5 h-5" />
            查看应用介绍
          </Link>
          
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </div>
        </div>
        
        <p className="mt-8 text-white/50 text-sm">
          如有疑问，请联系管理员
        </p>
      </div>
    </div>
  );
}

export default function DisabledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-cyan-600 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    }>
      <DisabledContent />
    </Suspense>
  );
}
