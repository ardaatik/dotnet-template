import type { Link } from '@/types/api';
import { useCallback, useRef, useState, type UIEvent } from 'react';

type PageResult<T> = { items: T[]; links: Link[]; totalCount?: number };

type LoadPageParams = {
  pageSize?: number;
  sort?: string;
  url?: string;
  filters?: Record<string, string | undefined>;
};

interface UseInfiniteHateoasListOptions<
  T,
  F extends Record<string, string | undefined> = Record<string, string | undefined>,
> {
  // eslint-disable-next-line no-unused-vars -- type-only parameter name
  loadPage: (params: LoadPageParams & { filters?: F }) => Promise<PageResult<T> | null>;
  pageSize?: number;
  sort?: string;
  filters?: F;
}

export function useInfiniteHateoasList<
  T,
  F extends Record<string, string | undefined> = Record<string, string | undefined>,
>({ loadPage, pageSize = 25, sort, filters }: UseInfiniteHateoasListOptions<T, F>) {
  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextPageLink, setNextPageLink] = useState<Link | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const loadingInitialRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const applyResult = useCallback((result: PageResult<T>, append: boolean) => {
    setItems(prev => (append ? [...prev, ...result.items] : result.items));
    setNextPageLink(result.links.find(link => link.rel === 'next-page') ?? null);
    if (result.totalCount != null) {
      setTotalCount(result.totalCount);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    loadingInitialRef.current = true;
    setNextPageLink(null);
    loadingMoreRef.current = false;
    setIsLoadingMore(false);

    try {
      const result = await loadPage({ pageSize, sort, filters });
      if (result) {
        applyResult(result, false);
      }
    } finally {
      loadingInitialRef.current = false;
    }
  }, [loadPage, pageSize, sort, filters, applyResult]);

  const loadMore = useCallback(async () => {
    if (!nextPageLink || loadingMoreRef.current || loadingInitialRef.current) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const result = await loadPage({ url: nextPageLink.href });
      if (result) {
        applyResult(result, true);
      }
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [nextPageLink, loadPage, applyResult]);

  const handleScroll = useCallback(
    (e: UIEvent<HTMLElement>) => {
      const onPageBottom =
        Math.ceil(e.currentTarget.scrollTop + e.currentTarget.clientHeight) >=
        e.currentTarget.scrollHeight;

      if (onPageBottom && nextPageLink && !loadingMoreRef.current && !loadingInitialRef.current) {
        void loadMore();
      }
    },
    [nextPageLink, loadMore]
  );

  return {
    items,
    totalCount,
    hasNextPage: nextPageLink != null,
    isLoadingMore,
    loadInitial,
    loadMore,
    handleScroll,
    containerRef,
  };
}
