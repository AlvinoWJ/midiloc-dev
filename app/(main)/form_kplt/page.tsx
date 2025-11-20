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

  /** Status yang sedang dilihat (needinput / inprogress / ok / nok) */
  const [activeStatus, setActiveStatus] = useState<StatusKey>("needinput");

  /** Cursor untuk masing-masing status */
  const [cursors, setCursors] = useState<Record<StatusKey, Cursor | undefined>>(
    {
      needinput: undefined,
      inprogress: undefined,
      ok: undefined,
      nok: undefined,
    }
  );

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

    cursorNeedinput: cursors.needinput,
    cursorInprogress: cursors.inprogress,
    cursorOk: cursors.ok,
    cursorNok: cursors.nok,
  });

  /** -------------------------
   *  UPDATE CURSOR SETELAH FETCH
   *  ------------------------- */
  useEffect(() => {
    if (!pagination) return;

    setCursors({
      needinput: pagination.needinput.cursor,
      inprogress: pagination.inprogress.cursor,
      ok: pagination.ok.cursor,
      nok: pagination.nok.cursor,
    });
  }, [pagination]);

  /** -------------------------
   *  FINAL LOADING & ERROR STATUS
   *  ------------------------- */
  const isLoading = loadingUser || isInitialLoading;
  const isPageError = !!userError || !!kpltError;

  /** -------------------------
   *  HANDLER SEARCH / FILTER / TAB
   *  ------------------------- */
  const resetCursorAndStatus = () => {
    setActiveStatus("needinput");
    setCursors({
      needinput: undefined,
      inprogress: undefined,
      ok: undefined,
      nok: undefined,
    });
  };

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    resetCursorAndStatus();
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    resetCursorAndStatus();
  };

  const onTabChange = (tab: string) => {
    if (tab === "Recent" || tab === "History") {
      setActiveTab(tab); // sudah dianggap sebagai TabType
      resetCursorAndStatus();
    } else {
      console.warn("Unknown tab:", tab);
    }
  };

  /** -------------------------
   *  TRANSFORM + FILTER DATA
   *  ------------------------- */
  const combinedAndTransformedData = useMemo(() => {
    const raw = [
      ...needinput.map((i) => ({ ...i, statusKey: "needinput" as StatusKey })),
      ...inprogress.map((i) => ({
        ...i,
        statusKey: "inprogress" as StatusKey,
      })),
      ...ok.map((i) => ({ ...i, statusKey: "ok" as StatusKey })),
      ...nok.map((i) => ({ ...i, statusKey: "nok" as StatusKey })),
    ];

    const filtered = raw.filter((i) => i.statusKey === activeStatus);

    return filtered.map((item) => {
      const status =
        item.statusKey === "needinput"
          ? "Need Input"
          : item.kplt_approval || item.statusKey;

      return {
        id: item.id || item.ulok_id || "",
        nama:
          item.statusKey === "needinput"
            ? item.nama_ulok || "Unknown ULOK"
            : item.nama_kplt || "Unknown KPLT",
        alamat: item.alamat,
        created_at: item.created_at,
        status,
        has_file_intip: item.files_ok ?? false,
        has_form_ukur: false,
      } as UnifiedKpltItem;
    });
  }, [needinput, inprogress, ok, nok, activeStatus]);

  /** -------------------------
   *  PAGINATION (Cursor-based)
   *  ------------------------- */
  const activePagination = pagination?.[activeStatus];
  const hasNextPage = activePagination?.cursor.hasNextPage ?? false;

  const handleNextPage = () => {
    if (hasNextPage) refresh();
  };

  const kpltProps: KpltPageProps = {
    user,
    isLoading,
    isRefreshing,
    isError: isPageError,

    displayData: combinedAndTransformedData,

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
    currentPage: 1,
    totalPages: hasNextPage ? 2 : 1,
    onPageChange: (page: number) => {
      if (page === 2) handleNextPage();
    },
  };

  return <KpltLayout {...kpltProps} />;
}
