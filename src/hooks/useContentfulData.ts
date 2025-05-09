import { useQuery } from '@tanstack/react-query';
import { loadContentfulData, contentfulDataStore } from '../data/contentfulData';
import type { HomepageBanner, Brand } from '../services/contentful';

export const queryKeys = {
  contentfulData: 'contentfulData',
  banners: 'banners',
  brands: 'brands',
};

// Load all Contentful data once
const loadAllContentfulData = async () => {
  const data = await loadContentfulData();
  return data;
};

export function useContentfulBanners() {
  return useQuery<HomepageBanner[]>({
    queryKey: [queryKeys.contentfulData, queryKeys.banners],
    queryFn: async () => {
      const data = await loadAllContentfulData();
      return data.homepageBanners;
    },
    staleTime: Infinity, // Data is static, never stale
    gcTime: Infinity, // Keep in cache forever
    select: (data) => data.sort((a, b) => a.orderId - b.orderId), // Sort banners by orderId
  });
}

export function useContentfulBrands() {
  return useQuery<Brand[]>({
    queryKey: [queryKeys.contentfulData, queryKeys.brands],
    queryFn: async () => {
      const data = await loadAllContentfulData();
      return data.brands;
    },
    staleTime: Infinity, // Data is static, never stale
    gcTime: Infinity, // Keep in cache forever
  });
}

export function useContentfulData() {
  return useQuery({
    queryKey: [queryKeys.contentfulData],
    queryFn: loadAllContentfulData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
} 