import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    // Use placeholder while loading
    const placeholder = `data:image/svg+xml,%3Csvg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23f1f5f9"/%3E%3C/svg%3E`;
    
    if (isLoading) {
      setImageSrc(placeholder);
    }

    // Preload image
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };
  }, [src, width, height, onLoad, onError]);

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-slate-100 text-slate-400",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={cn(
        "transition-opacity duration-300",
        isLoading ? "opacity-0" : "opacity-100",
        className
      )}
    />
  );
}