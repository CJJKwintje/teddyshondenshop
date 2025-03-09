import { useEffect, useRef, useState } from 'react';

export function useInfiniteScroll(callback: () => void) {
  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const currentElement = loadMoreRef.current;
    
    observer.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetching) {
          setIsFetching(true);
          callback();
        }
      },
      { threshold: 1.0 }
    );

    if (currentElement) {
      observer.current.observe(currentElement);
    }

    return () => {
      if (currentElement && observer.current) {
        observer.current.unobserve(currentElement);
      }
    };
  }, [callback, isFetching]);

  return { loadMoreRef, isFetching, setIsFetching };
}