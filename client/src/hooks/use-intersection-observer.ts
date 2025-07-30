import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}): [
  (node: Element | null) => void,
  IntersectionObserverEntry | undefined
] {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const frozen = useRef(false);

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    if (frozen.current && freezeOnceVisible) return;
    setEntry(entry);
    if (entry.isIntersecting && freezeOnceVisible) {
      frozen.current = true;
    }
  };

  const nodeRef = useRef<Element | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const observe = (node: Element | null) => {
    if (observer.current) observer.current.disconnect();
    
    if (node) {
      observer.current = new IntersectionObserver(updateEntry, {
        threshold,
        root,
        rootMargin,
      });
      observer.current.observe(node);
    }
    
    nodeRef.current = node;
  };

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return [observe, entry];
}