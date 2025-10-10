'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loaded) {
            setIsInView(true);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [loaded]);

  useEffect(() => {
    if (isInView && !loaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        onError?.();
      };
    }
  }, [isInView, src, loaded, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={loaded ? src : placeholder}
      alt={alt}
      className={`${className} ${
        loaded ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
      {...props}
    />
  );
}
