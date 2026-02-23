interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 28, className }: AppLogoProps) {
  const iconSize = size * 0.5;

  return (
    <div
      className={`bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white dark:text-gray-900"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
        <line x1="5" y1="22" x2="19" y2="22" />
      </svg>
    </div>
  );
}
