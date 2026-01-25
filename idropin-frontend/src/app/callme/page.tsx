'use client';

import Image from 'next/image';
import { Suspense } from 'react';
import { User, Mail, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';

function ContactContent() {
  const baseInfo = [
    {
      icon: <User className="w-5 h-5" />,
      text: '粥里有勺糖',
      href: 'https://sugarat.top',
    },
    {
      icon: <Mail className="w-5 h-5" />,
      text: 'engineerzjl@foxmail.com',
      href: 'mailto:engineerzjl@foxmail.com',
    },
  ];

  const qrCodes = [
    {
      text: '微信',
      img: 'https://img.cdn.sugarat.top/mdImg/MTYxOTE1NTk3MTkyNA==619155971925',
    },
    {
      text: '公众号',
      img: 'https://img.cdn.sugarat.top/mdImg/MTYxOTE1NTYwNzQ5MQ==619155607491',
    },
    {
      text: 'QQ',
      img: 'https://img.cdn.sugarat.top/mdImg/MTYxOTE1NjQ5ODczOQ==619156498739',
    },
    {
      text: '交流群',
      img: 'https://img.cdn.sugarat.top/mdImg/MTY0Nzc2MTE2MTE2NA==ep-group.png',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-white/50 dark:border-slate-700/50 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            联系作者
          </h1>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {baseInfo.map((info, idx) => (
              <a
                key={idx}
                href={info.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all text-slate-700 dark:text-slate-200"
              >
                {info.icon}
                <span>{info.text}</span>
              </a>
            ))}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full mb-12" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {qrCodes.map((qrcode, idx) => (
              <div key={idx} className="text-center">
                <div className="font-medium text-slate-800 dark:text-white mb-4">
                  {qrcode.text}
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 inline-block">
                  <div className="relative w-32 h-32">
                    <Image 
                      src={qrcode.img} 
                      alt={qrcode.text} 
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              如遇无法解决的账号/使用问题，欢迎小窗联系我
            </p>
            <div>
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                回到首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallMePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactContent />
    </Suspense>
  );
}
