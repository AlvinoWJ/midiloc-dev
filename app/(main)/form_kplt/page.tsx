"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import {
  useKplt,
  KpltPageProps,
  UnifiedKpltItem,
  Cursor,
} from "@/hooks/kplt/useKplt";
import KpltLayout from "@/components/layout/kplt_layout";

type StatusKey = "needinput" | "inprogress" | "ok" | "nok";
type ScopeType = "recent" | "history";
type TabType = "Recent" | "History";

export default function KPLTPage() {
  /** -------------------------
   *  UI STATE
   *  ------------------------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("Recent");

  const history_per_page = 9;

  /** -------------------------
   *  USER HOOK
   *  ------------------------- */
  const { user, loadingUser, userError } = useUser();

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  /** -------------------------
   *  CALL useKplt HOOK
   *  ------------------------- */
  const {
    needinput,
    inprogress,
    ok,
    nok,
    pagination,
    isInitialLoading,
    isRefreshing,
    isError: kpltError,
    refresh,
  } = useKplt({
    scope: activeTab === "Recent" ? "recent" : "history",
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
    limit: history_per_page,
  });

  /** -------------------------
   *  FINAL LOADING & ERROR STATUS
   *  ------------------------- */
  const isLoading = loadingUser || isInitialLoading;
  const isPageError = !!userError || !!kpltError;

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const onTabChange = (tab: string) => {
    if (tab === "Recent" || tab === "History") {
      setActiveTab(tab); // sudah dianggap sebagai TabType
    } else {
      console.warn("Unknown tab:", tab);
    }
  };

  /** -------------------------
   *  TRANSFORM + FILTER DATA
   *  ------------------------- */
  const displayData = useMemo(() => {
    const raw = [
      ...needinput.map((i) => ({ ...i, statusKey: "needinput" as StatusKey })),
      ...inprogress.map((i) => ({
        ...i,
        statusKey: "inprogress" as StatusKey,
      })),
      ...ok.map((i) => ({ ...i, statusKey: "ok" as StatusKey })),
      ...nok.map((i) => ({ ...i, statusKey: "nok" as StatusKey })),
    ];

    // FIX: Filter data berdasarkan TAB, bukan activeStatus
    const tabFiltered = raw.filter((i) => {
      if (activeTab === "Recent") {
        return i.statusKey === "needinput" || i.statusKey === "inprogress";
      }
      if (activeTab === "History") {
        return i.statusKey === "ok" || i.statusKey === "nok";
      }
      return false;
    });

    return tabFiltered.map((item) => {
      const status =
        item.statusKey === "needinput"
          ? "Need Input"
          : item.kplt_approval || item.statusKey;

      const nama =
        item.statusKey === "needinput"
          ? item.nama_ulok || "Unknown ULOK"
          : item.nama_kplt || "Unknown KPLT";

      return {
        id: item.id || item.ulok_id || "",
        nama,
        alamat: item.alamat,
        created_at: item.created_at,
        status,
        has_file_intip: item.files_ok ?? false,
        has_form_ukur: false,
      } as UnifiedKpltItem;
    });
  }, [needinput, inprogress, ok, nok, activeTab]);

  /** -------------------------
   *  PAGINATION STATE
   *  ------------------------- */
  const [currentPage, setCurrentPage] = useState(1);

  /** -------------------------
   *  PAGINATION (Cursor-based)
   *  ------------------------- */
  const okCursor = pagination?.ok.cursor;
  const nokCursor = pagination?.nok.cursor;

  // Hanya periksa next page jika di tab History
  const hasNextPage =
    (activeTab === "History" &&
      (okCursor?.hasNextPage || nokCursor?.hasNextPage)) ??
    false;

  const totalPages = hasNextPage ? 2 : 1;

  const handleNextPage = () => {
    if (!hasNextPage) return;
    refresh(); // tetap pakai refresh sesuai route Anda
  };

  const onPageChange = (page: number) => {
    setCurrentPage(page);

    // Jika nanti API punya total count
    // TODO: totalPages = Math.ceil(totalCount / history_per_page)

    if (page === 2 && hasNextPage) {
      handleNextPage();
    }
  };

  const kpltProps: KpltPageProps = {
    user,
    isLoading,
    isRefreshing,
    isError: isPageError,

    displayData: displayData,

    /** UI State */
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,

    /** Handler */
    onSearch: onSearchChange,
    onFilterChange,
    onTabChange,
    isLocationSpecialist,

    /** Pagination */
    currentPage: currentPage,
    totalPages: totalPages,
    onPageChange,
  };

  return <KpltLayout {...kpltProps} />;
}
