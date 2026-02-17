import useSWR, { SWRConfiguration } from 'swr';
import { apiClient } from '@/lib/api/client';
import { AxiosRequestConfig } from 'axios';

const fetcher = async (url: string) => {
  const res = await apiClient.get(url);
  return res.data?.data ?? res.data;
};

export function useApi<T = any>(
  url: string | null,
  config?: SWRConfiguration & { axiosConfig?: AxiosRequestConfig }
) {
  const { axiosConfig, ...swrConfig } = config ?? {};

  const customFetcher = axiosConfig
    ? async (u: string) => {
        const res = await apiClient.get(u, axiosConfig);
        return res.data?.data ?? res.data;
      }
    : fetcher;

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    customFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...swrConfig,
    }
  );

  return { data, error, isLoading, isValidating, mutate };
}
