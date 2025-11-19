"use client";

import useSWR from "swr";
import type { AppUser } from "../useUser";

export type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
  latitude: string;
  longitude: string;
};

export interface Block {
  blockPage: number;
  blockSize: number;
  blockCount: number;
  hasMoreBlocks: boolean; // Flag untuk blok berikutnya
  isLastBlock: boolean; // Flag untuk blok terakhir
}

export interface Pagination {
  total: number;
  totalPagesUi: number;
  withCount: string;
  pageSizeUi: number;
}

interface ApiUlokResponse {
  data: Ulok[];
  block: Block;
  pagination: Pagination;
  meta?: { user?: AppUser };
}

interface UseUlokProps {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: string;
  activeTab?: string;
}

const CLIENT_PAGE_SIZE = 9;
const SERVER_BLOCK_SIZE = 90;
const PAGES_PER_BLOCK = SERVER_BLOCK_SIZE / CLIENT_PAGE_SIZE;

export function useUlok({
  page = 1,
  limit = CLIENT_PAGE_SIZE,
  search = "",
  month = "",
  year = "",
  activeTab = "Recent",
}: UseUlokProps = {}) {
  const blockPage = Math.ceil(page / PAGES_PER_BLOCK);
  const currentPageUi = ((page - 1) % PAGES_PER_BLOCK) + 1;

  const createUrl = () => {
    const params = new URLSearchParams();
    params.set("blockPage", blockPage.toString());
    params.set("blockSize", SERVER_BLOCK_SIZE.toString());

    if (search && search.trim() !== "") {
      params.set("search", search.trim());
    }
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (activeTab) params.set("tab", activeTab);

    return `/api/ulok?${params.toString()}`;
  };

  const apiUrl = createUrl();

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokResponse>(apiUrl, {
      keepPreviousData: true,
    });

  const hasData = !!data;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isValidating && hasData;

  const dataBlock = data?.data ?? [];
  const block = data?.block;

  const startIndex = (currentPageUi - 1) * CLIENT_PAGE_SIZE;
  const endIndex = startIndex + CLIENT_PAGE_SIZE;

  const ulokData = dataBlock.slice(startIndex, endIndex);
  const totalPagesUiInBlock = Math.ceil(dataBlock.length / CLIENT_PAGE_SIZE);

  const totalBlocks = block?.blockCount ?? 0;

  let trueTotalVirtualPages = totalBlocks * PAGES_PER_BLOCK;

  if (block?.isLastBlock) {
    const pagesInPreviousBlocks = (block.blockPage - 1) * PAGES_PER_BLOCK;
    trueTotalVirtualPages = pagesInPreviousBlocks + totalPagesUiInBlock;
  }

  const hasNextPage = page < trueTotalVirtualPages;

  return {
    ulokData: ulokData,
    isInitialLoading: isInitialLoading,
    meta: {
      totalPages: totalPagesUiInBlock,

      hasNextPage: hasNextPage,
      block: block,
      uiPagination: data?.pagination,
    },
    isRefreshing: isRefreshing,
    ulokError: error,
    refreshUlok: () => mutate(),
  };
}
