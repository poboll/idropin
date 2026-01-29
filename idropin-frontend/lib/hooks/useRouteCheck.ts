'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getRouteConfigs, RouteConfig } from '@/lib/api/config';

// Cache for route configs
let routeConfigCache: RouteConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Hook to check if current route is disabled
 * Returns { isChecking, isDisabled, message }
 */
export function useRouteCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkRoute = async () => {
      // Skip check for dashboard and other protected routes
      if (pathname?.startsWith('/dashboard')) {
        setIsChecking(false);
        return;
      }

      try {
        // Use cache if valid
        const now = Date.now();
        if (!routeConfigCache || now - cacheTimestamp > CACHE_DURATION) {
          routeConfigCache = await getRouteConfigs();
          cacheTimestamp = now;
        }

        // Find matching route config
        const config = routeConfigCache.find(r => {
          if (r.routePath === '/') {
            return pathname === '/';
          }
          return pathname === r.routePath || pathname?.startsWith(r.routePath + '/');
        });

        if (config && !config.isEnabled) {
          setIsDisabled(true);
          setMessage(config.redirectMessage || '该功能已被管理员禁用');
          
          // Redirect if configured
          if (config.redirectUrl) {
            router.replace(config.redirectUrl);
          }
        }
      } catch (error) {
        console.error('Failed to check route config:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkRoute();
  }, [pathname, router]);

  return { isChecking, isDisabled, message };
}

/**
 * Clear route config cache (call after admin updates config)
 */
export function clearRouteConfigCache() {
  routeConfigCache = null;
  cacheTimestamp = 0;
}
