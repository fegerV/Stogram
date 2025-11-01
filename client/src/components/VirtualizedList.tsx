import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  windowHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  windowHeight,
  renderItem,
  overscan = 3,
  onLoadMore,
  hasMore = false,
  loading = false,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);

      // Load more when near bottom
      if (onLoadMore && hasMore && !loading) {
        const scrollPercentage =
          (target.scrollTop + target.clientHeight) / target.scrollHeight;
        if (scrollPercentage > 0.8) {
          onLoadMore();
        }
      }
    },
    [onLoadMore, hasMore, loading]
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: windowHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}

export default VirtualizedList;

// Hook for infinite scroll
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<T[]>,
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await fetchFn(page);
      setItems((prev) => [...prev, ...newItems]);
      setPage((p) => p + 1);
      setHasMore(newItems.length === pageSize);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFn, pageSize]);

  useEffect(() => {
    loadMore();
  }, []);

  return { items, loadMore, hasMore, loading, setItems };
}

// Lazy image component
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className = '', placeholder = '' }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Message list virtualization example
export const VirtualizedMessageList: React.FC<{
  messages: any[];
  onLoadMore?: () => void;
}> = ({ messages, onLoadMore }) => {
  return (
    <VirtualizedList
      items={messages}
      itemHeight={80}
      windowHeight={600}
      overscan={5}
      onLoadMore={onLoadMore}
      hasMore={true}
      renderItem={(message, index) => (
        <div
          key={message.id || index}
          className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="flex items-start gap-3">
            <LazyImage
              src={message.sender?.avatar || '/default-avatar.png'}
              alt={message.sender?.displayName || 'User'}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">
                  {message.sender?.displayName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      )}
    />
  );
};
