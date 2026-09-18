import { useState, useEffect } from 'react';

function computeRelativeTime(lastUpdated: Date | string | null | undefined): string {
  if (!lastUpdated) {
    return 'Awaiting synchronization';
  }

  const dateObj = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 45) {
    return 'Updated just now';
  } else if (diffMin === 1) {
    return 'Updated 1m ago';
  } else if (diffMin < 60) {
    return `Updated ${diffMin}m ago`;
  } else {
    const diffHrs = Math.floor(diffMin / 60);
    return `Updated ${diffHrs}h ago`;
  }
}

/**
 * Calculates human-readable relative time ("Updated just now", "Updated 2m ago")
 * and updates every 10 seconds.
 */
export function useAutoRefresh(lastUpdated: Date | string | null | undefined): string {
  const [relativeTime, setRelativeTime] = useState<string>(() => computeRelativeTime(lastUpdated));

  useEffect(() => {
    const update = () => {
      setRelativeTime(computeRelativeTime(lastUpdated));
    };

    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return relativeTime;
}

export default useAutoRefresh;
