'use client'

import { useEffect, useState, useCallback } from 'react';
import { StatisticsData } from '@/lib/websocket/statisticsClient';
import { apiClient } from '@/lib/api/client';

export function useStatistics() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/statistics/file-stats');
      const data = response.data.data;
      
      const statisticsData: StatisticsData = {
        totalFiles: data.totalFiles || 0,
        totalStorageSize: data.totalSize || 0,
        todayUploads: data.todayUploads || 0,
        weekUploads: data.weekUploads || 0,
        monthUploads: data.monthUploads || 0,
        fileTypeDistribution: data.typeDistribution || [],
        uploadTrend: data.uploadTrend || [],
        categoryStatistics: data.categoryStats || [],
        storageUsage: {
          used: data.usedStorage || 0,
          total: data.totalStorage || 10737418240,
          percentage: data.storagePercentage || 0,
          remaining: (data.totalStorage || 10737418240) - (data.usedStorage || 0),
        },
      };
      
      setStatistics(statisticsData);
      setConnected(true);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('获取统计数据失败，请稍后重试');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
    
    const interval = setInterval(fetchStatistics, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchStatistics]);

  const refresh = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    connected,
    refresh,
  };
}
