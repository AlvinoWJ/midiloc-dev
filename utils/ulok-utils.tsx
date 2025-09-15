import { Ulok } from "@/types/common";

export const monthMap: Record<string, string> = {
  Januari: "01",
  Februari: "02",
  Maret: "03",
  April: "04",
  Mei: "05",
  Juni: "06",
  Juli: "07",
  Agustus: "08",
  September: "09",
  Oktober: "10",
  November: "11",
  Desember: "12",
};

export const filterUlokData = (
  ulokData: Ulok[],
  searchQuery: string,
  filterMonth: string,
  filterYear: string,
  activeTab: string
) => {
  return ulokData
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
        return ulok.approval_status === "OK" || ulok.approval_status === "NOK";
      }
      return true;
    });
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
