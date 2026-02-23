'use client';

import dynamic from 'next/dynamic';
import { AlertCircle } from 'lucide-react';

const AiRadarChart = dynamic(() => import('@/components/ai/AiRadarChart'), {
  loading: () => <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">加载图表...</div>,
  ssr: false,
});

interface AiEvaluationPanelProps {
  evaluation: {
    score: number;
    dimensions: Record<string, number>;
    feedback: string;
    summary: string;
    evaluatedAt: string;
  };
  isPlagiarized?: boolean;
  similarToId?: string | null;
  submitterName?: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreStyle(score: number) {
  if (score >= 90) return { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500', bar: 'bg-violet-500', ring: '#8b5cf6', grade: 'S', tier: '优秀' };
  if (score >= 80) return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', bar: 'bg-blue-500', ring: '#3b82f6', grade: 'A', tier: '良好' };
  if (score >= 70) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', bar: 'bg-emerald-500', ring: '#10b981', grade: 'B', tier: '中等' };
  if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', bar: 'bg-amber-500', ring: '#f59e0b', grade: 'C', tier: '及格' };
  return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', bar: 'bg-red-500', ring: '#ef4444', grade: 'D', tier: '不及格' };
}

export default function AiEvaluationPanel({ evaluation, isPlagiarized, similarToId, submitterName }: AiEvaluationPanelProps) {
  const { score, dimensions, feedback, summary, evaluatedAt } = evaluation;
  const style = getScoreStyle(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);
  const dimensionEntries = Object.entries(dimensions);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative w-[128px] h-[128px] flex-shrink-0">
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="currentColor"
              className="text-gray-100 dark:text-gray-800" strokeWidth="10" />
            <circle cx="64" cy="64" r={RADIUS} fill="none" stroke={style.ring}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              className="transition-all duration-700 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${style.text}`}>{score}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">/ 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold ${style.bg}`}>
              {style.grade}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{style.tier}</span>
          </div>
          {submitterName && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{submitterName}</p>
          )}
          {isPlagiarized && (
            <div className="mt-2 flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-xs font-medium w-fit">
                <AlertCircle className="w-3 h-3" />涉嫌抄袭
              </span>
              {similarToId && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  原始提交：<span className="font-mono">#{similarToId.slice(0, 8).toUpperCase()}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {dimensionEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">维度评分</h4>
          {dimensionEntries.map(([name, value]) => {
            const dimStyle = getScoreStyle(value);
            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{name}</span>
                  <span className={`font-medium tabular-nums ${dimStyle.text}`}>{value}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ease-out ${dimStyle.bar}`}
                    style={{ width: `${value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dimensionEntries.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">雷达图</h4>
          <AiRadarChart dimensions={dimensions} />
        </div>
      )}

      {summary && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">评价摘要</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {feedback && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">详细反馈</h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{feedback}</div>
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
        评估时间：{new Date(evaluatedAt).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}
