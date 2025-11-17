"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useAlert } from "@/components/shared/alertcontext";
import { UlokEksternalDetail } from "@/hooks/ulok_eksternal/useUlokEksternalDetail";
import { useUlokEksternalFile } from "@/hooks/ulok_eksternal/useUlokEksternalFiles";
import DetailUlokEksternalSkeleton from "@/components/ui/skleton";
import { useSWRConfig } from "swr";
import { swrKeys } from "@/lib/swr-keys";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  Building,
  ClipboardList,
  Camera,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/statusbadge";
import DetailMapCard from "@/components/map/DetailMapCard";
import Image from "next/image";
import { format } from "date-fns";
import { id as inLocale } from "date-fns/locale";
import SelectBranch from "../ui/SelectBranch";
import SelectLocationSpecialist from "../ui/SelectLocationSpecialist";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const DetailCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ${className}`}
  >
    {/* Header Kartu */}
    <div className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
    {/* Konten Kartu */}
    <div className="p-6">{children}</div>
  </div>
);

type DetailUlokEksternalLayoutProps = {
  ulok: UlokEksternalDetail | null;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
};

export default function DetailUlokEksternalLayout({
  ulok,
  isLoading,
  isError,
  mutate,
}: DetailUlokEksternalLayoutProps) {
  const router = useRouter();
  const { user, loadingUser } = useUser();
  const { showToast, showConfirmation } = useAlert();

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("");
  const [isAssigningSpecialist, setIsAssigningSpecialist] =
    useState<boolean>(false);

  const [approvingStatus, setApprovingStatus] = useState<"OK" | "NOK" | null>(
    null
  );

  const { mutate: globalMutate } = useSWRConfig();

  const handleAssignBranch = async () => {
    if (!selectedBranch || !ulok?.id) return;
    setIsAssigning(true);
    try {
      const response = await fetch(
        `/api/ulok_eksternal/${ulok.id}/assign-branch`, // Sesuai dengan API route
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branch_id: selectedBranch }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error || "Gagal melakukan penugasan";
        showToast({
          type: "error",
          title: "Gagal",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
      mutate();
      showToast({
        type: "success",
        title: "Sukses",
        message: "Branch berhasil ditugaskan!",
      });
      router.back();
      router.refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignSpecialist = async () => {
    if (!selectedSpecialist || !ulok?.id) return;
    setIsAssigningSpecialist(true);
    try {
      const response = await fetch(
        `/api/ulok_eksternal/${ulok.id}/assign-penanggungjawab`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ penanggungjawab: selectedSpecialist }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error || "Gagal melakukan penugasan";
        showToast({
          type: "error",
          title: "Gagal",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
      mutate();
      showToast({
        type: "success",
        title: "Sukses",
        message: "Location Specialist berhasil ditugaskan!",
      });
      await globalMutate(
        (key) =>
          typeof key === "string" && key.startsWith(swrKeys.ulokEksternal),
        undefined,
        { revalidate: true }
      );
      router.back();
      router.refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsAssigningSpecialist(false);
    }
  };

  const handleApproval = async (status: "OK" | "NOK") => {
    if (!ulok?.id) return;

    const actionText = status === "OK" ? "menyetujui" : "menolak";

    const confirmation = await showConfirmation({
      title: `Anda yakin ingin ${actionText} usulan ini?`,
      message: `Status akan diubah menjadi "${status}".`,
      confirmText: `Ya, ${actionText}`,
      cancelText: "Batal",
      type: "info",
    });

    if (!confirmation) return;

    setApprovingStatus(status);

    try {
      const response = await fetch(`/api/ulok_eksternal/${ulok.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_ulok_eksternal: status }),
      });

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error || "Gagal memperbarui status";
        showToast({
          type: "error",
          title: "Gagal",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
      mutate();
      showToast({
        type: "success",
        title: "Sukses",
        message: `Status usulan berhasil diubah menjadi ${status}!`,
      });
      await globalMutate(
        (key) =>
          typeof key === "string" && key.startsWith(swrKeys.ulokEksternal),
        undefined,
        { revalidate: true }
      );
      router.back();
      router.refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setApprovingStatus(null);
    }
  };

  if (isLoading) {
    return <DetailUlokEksternalSkeleton />;
  }

  if (isError || !ulok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isError ? "Gagal Memuat Data" : "Data Tidak Ditemukan"}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {isError
            ? "Terjadi kesalahan saat mengambil data."
            : "Data ulok eksternal dengan ID ini tidak dapat ditemukan."}
        </p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header (Tombol Kembali dan Judul) */}
      <div className="flex items-center justify-between gap-4">
        <Button onClick={() => router.back()} variant="back">
          <ArrowLeft size={20} className="mr-1" />
          Kembali
        </Button>

        <StatusBadge status={ulok.status_ulok_eksternal} />
      </div>

      {/* 2. Konten Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (Info) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Lokasi */}
          <DetailCard
            title="Informasi Lokasi"
            icon={<MapPin className="w-5 h-5 text-red-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                label="Alamat"
                value={ulok.alamat}
                className="md:col-span-2"
              />
              <InfoItem label="Desa/Kelurahan" value={ulok.desa_kelurahan} />
              <InfoItem label="Kecamatan" value={ulok.kecamatan} />
              <InfoItem label="Kabupaten/Kota" value={ulok.kabupaten} />
              <InfoItem label="Provinsi" value={ulok.provinsi} />
            </div>
          </DetailCard>

          {/* Spesifikasi Objek */}
          <DetailCard
            title="Spesifikasi Objek"
            icon={<Building className="w-5 h-5 text-red-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Bentuk Objek" value={ulok.bentuk_objek} />
              <InfoItem label="Alas Hak" value={ulok.alas_hak} />
              <InfoItem
                label="Jumlah Lantai"
                value={ulok.jumlah_lantai.toString()}
              />
              <InfoItem label="Lebar Depan" value={`${ulok.lebar_depan} m`} />
              <InfoItem label="Panjang" value={`${ulok.panjang} m`} />
              <InfoItem label="Luas" value={`${ulok.luas} m²`} />
              <InfoItem
                label="Harga Sewa/Tahun"
                value={formatCurrency(ulok.harga_sewa)}
                className="md:col-span-2"
              />
            </div>
          </DetailCard>

          {/* Informasi Pemilik */}
          <DetailCard
            title="Informasi Pemilik"
            icon={<User className="w-5 h-5 text-red-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Nama Pemilik" value={ulok.nama_pemilik} />
              <InfoItem label="Kontak Pemilik" value={ulok.kontak_pemilik} />
            </div>
          </DetailCard>

          {/* Penugasan */}
          {!loadingUser &&
            user &&
            user.position_nama === "regional manager" && (
              <DetailCard
                title="Penugasan"
                icon={<Briefcase className="w-5 h-5 text-red-500" />}
              >
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="branch-select"
                      className="text-base font-medium text-gray-900 mb-2 block"
                    >
                      Pilih Branch
                    </label>
                    <SelectBranch
                      id="branch-select"
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                      disabled={isAssigning}
                    />
                  </div>

                  <Button
                    onClick={handleAssignBranch}
                    disabled={!selectedBranch || isAssigning}
                    className="w-full"
                  >
                    {isAssigning && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isAssigning ? "Menyimpan..." : "Tugaskan Branch"}
                  </Button>
                </div>
              </DetailCard>
            )}

          {!loadingUser &&
            user &&
            (user.position_nama === "branch manager" ||
              user.position_nama === "location manager") && (
              <DetailCard
                title="Penugasan"
                icon={<Briefcase className="w-5 h-5 text-red-500" />}
              >
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="LocationSpecialist-select"
                      className="text-base font-medium text-gray-900 mb-2 block"
                    >
                      Pilih Location Specialist
                    </label>
                    <SelectLocationSpecialist
                      id="LocationSpecialist-select"
                      value={selectedSpecialist}
                      onValueChange={setSelectedSpecialist}
                      disabled={isAssigningSpecialist}
                    />
                  </div>

                  <Button
                    onClick={handleAssignSpecialist}
                    disabled={!selectedSpecialist || isAssigningSpecialist}
                    className="w-full"
                  >
                    {isAssigningSpecialist && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isAssigningSpecialist
                      ? "Menyimpan..."
                      : "Tugaskan Location Specialist"}
                  </Button>
                </div>
              </DetailCard>
            )}

          {!loadingUser &&
            user &&
            user.position_nama === "location specialist" &&
            ulok.penanggungjawab?.nama === user.nama &&
            ulok.status_ulok_eksternal !== "OK" &&
            ulok.status_ulok_eksternal !== "NOK" && (
              <DetailCard
                title="Tindakan Persetujuan"
                icon={<CheckCircle className="w-5 h-5 text-red-500" />}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Anda ditugaskan sebagai penanggungjawab untuk usulan lokasi
                  ini. Silakan berikan persetujuan Anda.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => handleApproval("NOK")}
                    disabled={approvingStatus !== null}
                    variant="default"
                    className="flex-1"
                  >
                    {approvingStatus === "NOK" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Tolak (NOK)
                  </Button>
                  <Button
                    onClick={() => handleApproval("OK")}
                    disabled={approvingStatus !== null}
                    variant="submit"
                    className="flex-1"
                  >
                    {approvingStatus === "OK" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Setujui (OK)
                  </Button>
                </div>
              </DetailCard>
            )}
        </div>

        {/* Kolom Kanan (Peta & Foto) */}
        <div className="space-y-6">
          {/* Peta */}
          <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ">
            <DetailMapCard
              latitude={ulok.latitude}
              longitude={ulok.longitude}
            />
          </div>

          {/* Foto Lokasi */}
          <DetailCard
            title="Foto Lokasi"
            icon={<Camera className="w-5 h-5 text-red-500" />}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
              <FotoLokasiAutoPreview
                ulokId={ulok.id}
                fileKey={ulok.foto_lokasi}
              />
            </div>
          </DetailCard>
          <DetailCard
            title="Riwayat"
            icon={<ClipboardList className="w-5 h-5 text-red-500" />}
          >
            <div className="space-y-4">
              {ulok.created_at && (
                <InfoItem
                  label="Dibuat Pada"
                  value={format(
                    new Date(ulok.created_at),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: inLocale,
                    }
                  )}
                />
              )}
              {ulok.updated_at && (
                <InfoItem
                  label="Diperbarui Pada"
                  value={format(
                    new Date(ulok.updated_at),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: inLocale,
                    }
                  )}
                />
              )}
              {ulok.approved_at && (
                <InfoItem
                  label="Disetujui Pada"
                  value={format(
                    new Date(ulok.approved_at),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: inLocale,
                    }
                  )}
                />
              )}
              {ulok.branch_id?.nama && (
                <InfoItem label="Branch" value={ulok.branch_id.nama} />
              )}
              {ulok.penanggungjawab?.nama && (
                <InfoItem
                  label="PenanggungJawab"
                  value={ulok.penanggungjawab.nama}
                />
              )}

              {/* {ulok.penanggungjawab && (
                <InfoItem
                  label="PenanggungJawab"
                  value={ulok.penanggungjawab.nama}
                />
              )} */}
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null;
  className?: string;
}) => (
  <div className={className}>
    <dt className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
      {label}
    </dt>
    <dd className="text-sm lg:text-base bg-gray-100 font-medium px-4 py-3 rounded-lg">
      {value || "-"}
    </dd>
  </div>
);

const FotoLokasiAutoPreview = ({
  ulokId,
  fileKey,
}: {
  ulokId: string;
  fileKey: string | null | undefined;
}) => {
  const { fetchFile, loading, error } = useUlokEksternalFile();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  useEffect(() => {
    let mounted = true;
    setPreviewUrl(null);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (!fileKey) return;

    (async () => {
      try {
        let res: unknown = null;
        try {
          res = await (fetchFile as any)(ulokId, fileKey, "proxy");
        } catch (e) {
          try {
            res = await (fetchFile as any)(fileKey, { mode: "proxy" });
          } catch (e2) {
            res = await (fetchFile as any)(fileKey);
          }
        }

        if (!mounted) return;

        if (res instanceof Blob) {
          const url = URL.createObjectURL(res);
          setObjectUrl(url);
          setPreviewUrl(url);
          return;
        }

        if (
          res &&
          typeof res === "object" &&
          (("blob" in (res as any) && (res as any).blob instanceof Blob) ||
            ("data" in (res as any) &&
              (res as any).data &&
              (res as any).data instanceof Blob))
        ) {
          const b: Blob =
            (res as any).blob instanceof Blob
              ? (res as any).blob
              : (res as any).data;
          const url = URL.createObjectURL(b);
          setObjectUrl(url);
          setPreviewUrl(url);
          return;
        }
        if (typeof res === "string") {
          setPreviewUrl(res);
          return;
        }
        setPreviewUrl(null);
      } catch (err) {
        setPreviewUrl(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ulokId, fileKey, fetchFile]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
      {loading && <p className="text-gray-400 text-sm">Memuat foto...</p>}

      {error && (
        <p className="text-red-500 text-sm">Gagal memuat foto lokasi</p>
      )}

      {!loading && !previewUrl && !error && (
        <p className="text-gray-400 text-sm">Foto tidak tersedia</p>
      )}

      {previewUrl && (
        <Image
          src={previewUrl}
          alt="Foto Lokasi"
          fill
          className="object-cover"
          onError={() => {
            setPreviewUrl(null);
          }}
        />
      )}
    </div>
  );
};
