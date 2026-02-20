'use client'

import { useEffect, useState, useCallback, useRef } from 'react';
import { StatisticsData } from '@/lib/websocket/statisticsClient';
import { getToken } from '@/lib/api/client';
import { API_BASE_URL } from '@/lib/api/baseUrl';

export function useStatistics() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const token = getToken();
    if (!token) {
      setError('未登录');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/statistics/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      retryRef.current = 0;
      setConnected(true);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim()) as StatisticsData;
              setStatistics(data);
              setError(null);
            } catch {}
          }
        }
      }
      if (!ctrl.signal.aborted) {
        timerRef.current = setTimeout(connect, 1000);
      }
    }).catch((err) => {
      if (err.name === 'AbortError') return;
      setConnected(false);
      setLoading(false);
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current += 1;
      setError(`连接断开，${Math.round(delay / 1000)}s 后重试…`);
      timerRef.current = setTimeout(connect, delay);
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [connect]);

  return { statistics, loading, error, connected, refresh: connect };
}
