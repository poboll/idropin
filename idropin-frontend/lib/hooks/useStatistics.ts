'use client'

import { useEffect, useState, useCallback } from 'react';
import { statisticsClient, StatisticsData } from '@/lib/websocket/statisticsClient';

export function useStatistics() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let systemStatsSubscription = '';
    let userStatsSubscription = '';

    const connect = async () => {
      try {
        setLoading(true);
        await statisticsClient.connect(
          () => {
            setConnected(true);
            // 订阅系统统计数据
            systemStatsSubscription = statisticsClient.subscribeSystemStatistics((data) => {
              setStatistics(data);
              setError(null);
            });

            // 订阅用户统计数据
            userStatsSubscription = statisticsClient.subscribeUserStatistics((data) => {
              setStatistics(data);
              setError(null);
            });

            // 请求初始数据
            statisticsClient.requestStatistics();
          },
          (err) => {
            setError('Failed to connect to statistics service');
            console.error('Connection error:', err);
          }
        );
      } catch (err) {
        setError('Failed to connect to statistics service');
        console.error('Connection error:', err);
      } finally {
        setLoading(false);
      }
    };

    connect();

    return () => {
      if (systemStatsSubscription) {
        statisticsClient.unsubscribe(systemStatsSubscription);
      }
      if (userStatsSubscription) {
        statisticsClient.unsubscribe(userStatsSubscription);
      }
      statisticsClient.disconnect();
    };
  }, []);

  const refresh = useCallback(() => {
    if (connected) {
      statisticsClient.requestStatistics();
    }
  }, [connected]);

  return {
    statistics,
    loading,
    error,
    connected,
    refresh,
  };
}
