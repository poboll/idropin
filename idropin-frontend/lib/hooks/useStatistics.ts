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
      const response = await apiClient.get('/statistics/files');
      const data = response.data;
      
      const statisticsData: StatisticsData = {
        totalFiles: data.totalFiles || 0,
        totalStorageSize: data.totalStorageSize || 0,
        todayUploads: data.todayUploads || 0,
        weekUploads: data.weekUploads || 0,
        monthUploads: data.monthUploads || 0,
        fileTypeDistribution: data.fileTypeDistribution || [],
        uploadTrend: data.uploadTrend || [],
        categoryStatistics: data.categoryStatistics || [],
        storageUsage: data.storageUsage || {
          used: 0,
          total: 10737418240,
          percentage: 0,
          remaining: 10737418240,
        },
      };
      
      setStatistics(statisticsData);
      setConnected(true);
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err);
      const errorMessage = err?.response?.data?.message || err?.message || '获取统计数据失败，请稍后重试';
      setError(errorMessage);
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
