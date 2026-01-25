'use client'

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface StatisticsData {
  totalFiles: number;
  totalStorageSize: number;
  todayUploads: number;
  weekUploads: number;
  monthUploads: number;
  fileTypeDistribution: Array<{
    type: string;
    typeName: string;
    count: number;
    percentage: number;
  }>;
  uploadTrend: Array<{
    date: string;
    count: number;
    size: number;
  }>;
  categoryStatistics: Array<{
    categoryId: string;
    categoryName: string;
    fileCount: number;
    storageSize: number;
  }>;
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
    remaining: number;
  };
}

class StatisticsWebSocketClient {
  private client: Client | null = null;
  private connected = false;
  private listeners: Map<string, (data: StatisticsData) => void> = new Map();

  connect(onConnect?: () => void, onError?: (error: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/ws`);
      
      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.connected = true;
          console.log('WebSocket connected');
          onConnect?.();
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          onError?.(frame);
          reject(frame);
        },
        onWebSocketError: (error) => {
          console.error('WebSocket error:', error);
          onError?.(error);
          reject(error);
        },
      });

      this.client.activate();
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 订阅系统统计数据
   */
  subscribeSystemStatistics(callback: (data: StatisticsData) => void): string {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return '';
    }

    const subscription = this.client.subscribe('/topic/statistics/system', (message) => {
      try {
        const data = JSON.parse(message.body) as StatisticsData;
        callback(data);
      } catch (error) {
        console.error('Failed to parse statistics data:', error);
      }
    });

    return subscription.id;
  }

  /**
   * 订阅用户统计数据
   */
  subscribeUserStatistics(callback: (data: StatisticsData) => void): string {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return '';
    }

    const subscription = this.client.subscribe('/user/queue/statistics', (message) => {
      try {
        const data = JSON.parse(message.body) as StatisticsData;
        callback(data);
      } catch (error) {
        console.error('Failed to parse statistics data:', error);
      }
    });

    return subscription.id;
  }

  /**
   * 请求统计数据
   */
  requestStatistics(): void {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: '/app/statistics/request',
      body: JSON.stringify({}),
    });
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): void {
    if (this.client && subscriptionId) {
      this.client.unsubscribe(subscriptionId);
    }
  }
}

export const statisticsClient = new StatisticsWebSocketClient();
