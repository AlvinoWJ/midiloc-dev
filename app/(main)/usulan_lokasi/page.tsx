"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useUlok } from "@/hooks/useUlok";
import UlokLayout from "@/components/layout/ulok_layout";

const ITEMS_PER_PAGE = 9;

export default function UlokPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useUser();
  const { ulokData, ulokLoading, ulokError } = useUlok();

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  const paginatedData = useMemo(() => {
    const allFilteredUlok = (ulokData || [])
      .filter((ulok) => {
        const matchSearch =
          ulok.nama_ulok.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ulok.alamat.toLowerCase().includes(searchQuery.toLowerCase());
        const date = new Date(ulok.created_at);
        const ulokMonth = (date.getMonth() + 1).toString().padStart(2, "0");
        const ulokYear = date.getFullYear().toString();
        const matchMonth = filterMonth ? ulokMonth === filterMonth : true;
        const matchYear = filterYear ? ulokYear === filterYear : true;
        return matchSearch && matchMonth && matchYear;
      })
      .filter((ulok) => {
        if (activeTab === "Recent") {
          return ulok.approval_status === "In Progress";
        }
        if (activeTab === "History") {
          return (
            ulok.approval_status === "OK" || ulok.approval_status === "NOK"
          );
        }
        return true;
      });

    const totalPages = Math.ceil(allFilteredUlok.length / ITEMS_PER_PAGE);

    const paginatedUlok = allFilteredUlok.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    return { paginatedUlok, totalPages, allFilteredUlok };
  }, [ulokData, searchQuery, filterMonth, filterYear, activeTab, currentPage]);

  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const layoutProps = {
    user,
    isLoading: ulokLoading,
    isError: !!ulokError,
    filteredUlok: paginatedData.paginatedUlok,
    activeTab,
    searchQuery,
    filterMonth,
    filterYear,
    isLocationSpecialist,
    onTabChange: onTabChange,
    onSearch: onSearchChange,
    onFilterChange,
    currentPage: currentPage,
    totalPages: paginatedData.totalPages,
    onPageChange: setCurrentPage,
  };

  return <UlokLayout {...layoutProps} />;
}
