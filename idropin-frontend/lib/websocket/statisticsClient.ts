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
