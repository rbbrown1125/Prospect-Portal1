import { lazy } from 'react';

// Lazy load heavy components for better initial load performance
export const LazyDashboard = lazy(() => import('@/pages/dashboard'));
export const LazySites = lazy(() => import('@/pages/sites'));
export const LazySiteEdit = lazy(() => import('@/pages/site-edit'));
export const LazyProspects = lazy(() => import('@/pages/prospects'));
export const LazyContent = lazy(() => import('@/pages/content'));
export const LazyAnalytics = lazy(() => import('@/pages/analytics'));
export const LazyProfile = lazy(() => import('@/pages/profile'));
export const LazyAdmin = lazy(() => import('@/pages/admin'));
export const LazyTemplatePreview = lazy(() => import('@/pages/template-preview'));
export const LazyPublicSite = lazy(() => import('@/pages/public-site'));

// Preload critical routes for better perceived performance
export function preloadCriticalRoutes() {
  // Preload dashboard as it's likely the first page users see
  import('@/pages/dashboard');
  
  // Preload sites as it's a common navigation target
  import('@/pages/sites');
}