'use client';

import { useEffect } from 'react';

export default function ConsoleBanner() {
  useEffect(() => {
    // prettier-ignore
    const cat =
      '|\\ \u3000\u3000\u3000\u3000\u3000\u3000 \u3000\uff0f\u30d8\u3000\u3000\u3000\u3000\u3000\u3000\u3000 ..-\u2312_\u3000\u3000\u3000i! \u30d8_\u3000\u3000\u3000\u3000 \u3000\uff0f\u3000 `i!\u3000\u3000 .,.,\u3000.,.,.,.,_\u3000\u3000)\n' +
      '\u3000\u3000\u3000|\u3000\u3000 \u30dd\u30fc_-_\uff0f\u00b4\u3000\u3000 \u3000i!\u3000, ,_,,,..\'\'  \'\'.,\u3000 /\n' +
      '\u3000\u3000,/\'\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000 \u3000i!\'"\u3000....\u3000\'\'""\'\'\'\'  ,,Y"\n' +
      '\u3000,/\'\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3003\u3000\u30e2\u30d5\u30e2\u30d5 \u3000\'i;,-\u3000\u30d8,,\n' +
      '\u3000i\'\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000 \u3000 \'i,\uff1eo\uff1c|\u3000\u3000\u3000\u3000\u3000\u3000"\u30d8,\n' +
      '\u3000i!\u3000\u25cf\u3000\u3000\u3000\u3000\u25cf\u3000 \u3000 \u3000\uff0a ,i\u30fb v \u30fb\u4ece\u3000\u3000\u3000\u3000\u3000 \u3000")\n' +
      '\u3000 \'i,::\u3000 \uff84\u30fc-\uff72\u3000 :::::::\u3000\u3000,/\u3068\u3000\u3000\u30d8\u3000\u3000\u3000\u30fb" ,,i,-\'"\n' +
      '.,_\u30fc"\'\'\\u3001\u3000\u30d8_\u30ce\u3000 \u3000 \u3000_,-\u3000\u30fe\u3000\u3000 )\u3000.,.,.,,,\n' +
      '\u3000 "\'\'\'  \u3000.,.,_-"\'\'   \u3000\u30c0_ _) \uff3e\uff3e"\n' +
      ',.,_-"\u3000\u3000\u3000,,-"\'\'   \u3000\u30ce-_"\'\'/' +
      '\n\u3000\u3000(\u3000\u3000\u3000\u3000\u3000\u3000\u3000 .,-\'\'\n' +
      '\u3000\u3000\u3000\u30d8.,,,\u3000_,-\'\'""';

    const messages: [string, ...string[]][] = [
      [
        '%c Idrop.in · 云集%c  智能文件收集与管理平台',
        'color: #111827; font-weight: 800; font-size: 15px;',
        'color: #6b7280; font-size: 12px; font-weight: 400;',
      ],
      ['%c' + cat, 'color: #9ca3af; font-family: monospace; font-size: 11px; line-height: 1.6;'],
      ['%c' + '─'.repeat(44), 'color: #d1d5db; font-size: 11px;'],
      ['%c⬡ 分片上传 · 断点续传 · MinIO 对象存储 · AI 智能批改', 'color: #374151; font-size: 11px;'],
      ['%c⬡ JWT RS256 · Spring Security · Redis 会话缓存', 'color: #374151; font-size: 11px;'],
      ['%c⬡ SSE 推送 · 文件趋势 · 存储分析 · 实时统计', 'color: #374151; font-size: 11px;'],
      ['%c' + '─'.repeat(44), 'color: #d1d5db; font-size: 11px;'],
      [
        '%c⬡ 开源地址%c  https://github.com/poboll/idropin',
        'color: #111827; font-weight: 700; font-size: 11px;',
        'color: #6b7280; font-size: 11px; text-decoration: underline;',
      ],
      ['%c  如果喜欢请给个 Star，感谢支持 :)', 'color: #9ca3af; font-size: 11px;'],
    ];

    for (const args of messages) {
      console.log(...args);
    }
  }, []);

  return null;
}
