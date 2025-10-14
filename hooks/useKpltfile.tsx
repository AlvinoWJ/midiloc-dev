import useSWR from "swr";

export type KpltFile = {
  name: string;
  field: string | null;
  size: number;
  last_modified: string; // ISO string date
  href: string;
};

export type KpltFilesApiResponse = {
  id: string;
  folder: string;
  page: number;
  limit: number;
  count: number;
  files: KpltFile[];
};

export type MappedKpltFile = {
  name: string;
  field: string | null;
  href: string;
  sizeFormatted: string; // e.g., "1.4 KB"
  lastModifiedFormatted: string; // e.g., "13/10/2025"
  fileType: "pdf" | "excel" | "video" | "image" | "other";
};

class FetchError extends Error {
  info: any;
  status: number;

  constructor(message: string, info: any, status: number) {
    super(message);
    this.name = "FetchError";
    this.info = info;
    this.status = status;
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorInfo = await res.json();
    throw new FetchError(
      "An error occurred while fetching the data.",
      errorInfo,
      res.status
    );
  }
  return res.json();
};

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getFileType(fileName: string): MappedKpltFile["fileType"] {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  return "other";
}

function mapKpltFilesResponse(
  data: KpltFilesApiResponse | undefined
): MappedKpltFile[] | undefined {
  if (!data || !data.files) return undefined;

  return data.files.map((file) => ({
    name: file.name,
    field: file.field,
    href: file.href,
    sizeFormatted: formatBytes(file.size),
    lastModifiedFormatted: new Date(file.last_modified).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ),
    fileType: getFileType(file.name),
  }));
}

export function useKpltFiles(id: string | undefined) {
  const key = id ? `/api/kplt/${id}/files` : null;

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR<KpltFilesApiResponse>(key, fetcher);

  const files = mapKpltFilesResponse(rawData);

  return {
    files,
    rawData,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
