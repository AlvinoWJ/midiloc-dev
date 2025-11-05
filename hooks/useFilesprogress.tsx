"use client";

import { useEffect, useState } from "react";

export interface FileItem {
  name: string;
  field: string | null;
  size: number | null;
  last_modified: string | null;
  href: string; // sudah berupa endpoint API yang bisa diakses
}

export function useFile(modules: string, id: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modules || !id) return;

    async function fetchFiles() {
      try {
        setLoading(true);
        const res = await fetch(`/api/files/${modules}/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setFiles(data.files ?? []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, [modules, id]);

  return { files, loading, error };
}
