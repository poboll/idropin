import { apiClient } from './client';

export interface AnnouncementConfig {
  enabled: boolean;
  content: string;
}

export async function getAnnouncementConfig(): Promise<AnnouncementConfig> {
  try {
    const [enabledRes, contentRes] = await Promise.all([
      apiClient.get<{ code: number; data: string }>(
        '/config/system/website.announcement.enabled'
      ),
      apiClient.get<{ code: number; data: string }>(
        '/config/system/website.announcement.content'
      ),
    ]);

    return {
      enabled: enabledRes.data.data === 'true',
      content: contentRes.data.data || '',
    };
  } catch (error) {
    console.error('Failed to fetch announcement config:', error);
    return {
      enabled: false,
      content: '',
    };
  }
}
