import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface TableLoadMoreRowProps {
  colSpan: number;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  scrollRootRef: React.RefObject<HTMLElement | null>;
  showEndMessage?: boolean;
  showLoadMoreButton?: boolean;
}

export const TableLoadMoreRow: React.FC<TableLoadMoreRowProps> = ({
  colSpan,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
  scrollRootRef,
  showEndMessage = true,
  showLoadMoreButton = true,
}) => {
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { root, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, onLoadMore, scrollRootRef]);

  if (!hasNextPage && !isLoadingMore && !showEndMessage) {
    return null;
  }

  const showButton = showLoadMoreButton && (hasNextPage || isLoadingMore);
  const showEnd = showEndMessage && !hasNextPage && !isLoadingMore;

  return (
    <TableRow
      ref={sentinelRef}
      className="border-0 hover:bg-transparent data-[state=selected]:bg-transparent"
    >
      <TableCell
        colSpan={colSpan}
        className={cn('border-0 text-center', showButton || showEnd ? 'py-2' : 'h-px p-0')}
      >
        {showButton ? (
          <Button disabled={isLoadingMore} onClick={onLoadMore} variant="outline" size="sm">
            {isLoadingMore ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        ) : showEnd ? (
          <p className="text-sm text-muted-foreground">No more rows to load</p>
        ) : isLoadingMore ? (
          <LoaderCircle className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </TableCell>
    </TableRow>
  );
};
