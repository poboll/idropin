import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'table-row' | 'stats' | 'list-item';
  count?: number;
}

const SkeletonCard = () => (
  <div className="card p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-7 h-7 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    </td>
  </tr>
);

const SkeletonStats = () => (
  <div className="card p-5 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16 mb-2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-12" />
      </div>
    </div>
  </div>
);

const SkeletonListItem = () => (
  <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
    </div>
  </div>
);

export function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  const Component = {
    card: SkeletonCard,
    'table-row': SkeletonTableRow,
    stats: SkeletonStats,
    'list-item': SkeletonListItem,
  }[variant];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
