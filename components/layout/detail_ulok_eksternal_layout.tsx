"use client";

/**
 * DetailUlokEksternalLayout
 * -------------------------
 * Halaman detail untuk Usulan Lokasi (ULOK) Eksternal.
 *
 * Fitur Utama:
 * - **Role-Based Actions**: Menampilkan tombol aksi yang berbeda berdasarkan jabatan user:
 * - **Regional Manager (RM)**: Assign Branch.
 * - **Branch/Location Manager (BM/LM)**: Assign Location Specialist.
 * - **Location Specialist**: Approve (OK) / Reject (NOK).
 * - **Secure Image Preview**: Mengambil foto lokasi melalui proxy API aman dengan dukungan caching blob & fullscreen modal.
 * - **Interactive Map**: Visualisasi koordinat lokasi.
 * - **Editable Assignments**: Mode edit untuk mengubah penugasan Branch atau Specialist jika belum final.
 */

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
  X,
  Maximize2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/statusbadge";
import DetailMapCard from "@/components/map/DetailMapCardUlokEksternal";
import Image from "next/image";
import { format } from "date-fns";
import { id as inLocale } from "date-fns/locale";
import SelectBranch from "../ui/SelectBranch";
import SelectLocationSpecialist from "../ui/SelectLocationSpecialist";

// --- Utility Functions ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Wrapper UI standar untuk kartu detail (Card).
 */
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
  const { mutate: globalMutate } = useSWRConfig();

  // --- State: Penugasan Branch (Role: RM) ---
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [isEditingBranch, setIsEditingBranch] = useState<boolean>(false);

  // --- State: Penugasan Specialist (Role: BM/LM) ---
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("");
  const [isAssigningSpecialist, setIsAssigningSpecialist] =
    useState<boolean>(false);
  const [isEditingSpecialist, setIsEditingSpecialist] =
    useState<boolean>(false);

  // --- State: Approval (Role: Specialist) ---
  const [approvingStatus, setApprovingStatus] = useState<"OK" | "NOK" | null>(
    null
  );

  /**
   * Effect: Sinkronisasi data awal ke state lokal.
   * Mengisi dropdown dengan data existing saat halaman dimuat.
   */
  useEffect(() => {
    if (ulok) {
      if (ulok.branch_id?.id) {
        setSelectedBranch(ulok.branch_id.id);
      }
      if (ulok.penanggungjawab?.id) {
        setSelectedSpecialist(ulok.penanggungjawab.id);
      }
    }
  }, [ulok]);

  /**
   * Handler: Assign Branch (Patch Request).
   * Digunakan oleh Regional Manager untuk menugaskan usulan ke Cabang tertentu.
   */
  const handleAssignBranch = async () => {
    if (!selectedBranch || !ulok?.id) return;
    setIsAssigning(true);
    try {
      const response = await fetch(
        `/api/ulok_eksternal/${ulok.id}/assign-branch`,
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
      await globalMutate(
        (key) =>
          typeof key === "string" && key.startsWith(swrKeys.ulokEksternal),
        undefined,
        { revalidate: true }
      );
      setIsEditingBranch(false);
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

  /**
   * Handler: Assign Specialist (Patch Request).
   * Digunakan oleh BM/LM untuk menugaskan Location Specialist.
   */
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
      setIsEditingSpecialist(false);
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

  /**
   * Handler: Approval Actions (OK/NOK).
   * Digunakan oleh Location Specialist untuk memfinalisasi usulan.
   */
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

  // --- Render States ---

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
      {/* Header (Tombol Kembali dan Judul) */}
      <div className="flex items-center justify-between gap-4">
        <Button onClick={() => router.back()} variant="back">
          <ArrowLeft size={20} className="mr-1" />
          Kembali
        </Button>

        <StatusBadge status={ulok.status_ulok_eksternal} />
      </div>

      {/* Konten Grid */}
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

          {/* --- Logic: Penugasan Branch (Hanya RM) --- */}
          {!loadingUser &&
            user &&
            user.position_nama === "regional manager" &&
            ulok.status_ulok_eksternal !== "OK" &&
            ulok.status_ulok_eksternal !== "NOK" && (
              <DetailCard
                title="Penugasan"
                icon={<Briefcase className="w-5 h-5 text-red-500" />}
              >
                <div className="space-y-6">
                  {ulok.branch_id && !isEditingBranch ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          Branch
                        </p>
                        <p className="text-base lg:text-lg font-semibold text-gray-900">
                          {ulok.branch_id.nama}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsEditingBranch(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <>
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

                      <div className="flex gap-3">
                        {isEditingBranch && (
                          <Button
                            variant="default"
                            onClick={() => {
                              setIsEditingBranch(false);

                              if (ulok.branch_id?.id) {
                                setSelectedBranch(ulok.branch_id.id);
                              }
                            }}
                            className="flex-1"
                            disabled={isAssigning}
                          >
                            Batal
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={handleAssignBranch}
                          className={isEditingBranch ? "flex-1" : "w-full"}
                        >
                          {isAssigning && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isAssigning ? "Menyimpan..." : "Simpan Penugasan"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DetailCard>
            )}

          {/* --- Logic: Penugasan Specialist (Hanya BM/LM) --- */}
          {!loadingUser &&
            user &&
            (user.position_nama === "branch manager" ||
              user.position_nama === "location manager") &&
            ulok.status_ulok_eksternal !== "OK" &&
            ulok.status_ulok_eksternal !== "NOK" && (
              <DetailCard
                title="Penugasan"
                icon={<Briefcase className="w-5 h-5 text-red-500" />}
              >
                <div className="space-y-6">
                  {ulok.penanggungjawab && !isEditingSpecialist ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          Location Specialist
                        </p>
                        <p className="text-base lg:text-lg font-semibold text-gray-900">
                          {ulok.penanggungjawab.nama}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsEditingSpecialist(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <>
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

                      <div className="flex gap-3">
                        {isEditingSpecialist && (
                          <Button
                            variant="default"
                            onClick={() => {
                              setIsEditingSpecialist(false);
                              if (ulok.penanggungjawab?.id) {
                                setSelectedSpecialist(ulok.penanggungjawab.id);
                              }
                            }}
                            className="flex-1"
                            disabled={isAssigningSpecialist}
                          >
                            Batal
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={handleAssignSpecialist}
                          className={isEditingSpecialist ? "flex-1" : "w-full"}
                        >
                          {isAssigningSpecialist && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isAssigningSpecialist ? "Menyimpan..." : "Simpan"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DetailCard>
            )}

          {/* --- Logic: Tindakan Approval (Hanya Specialist Penanggungjawab) --- */}
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

        {/* --- Kolom Kanan (Visual & History) --- */}
        <div className="space-y-6">
          {/* Peta */}
          <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ">
            <DetailMapCard
              id={ulok.id}
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
          {/* Riwayat */}
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
              {ulok.updated_at && !ulok.approved_at && (
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
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---
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
    <dd className="text-sm lg:text-base bg-gray-100 font-medium px-4 py-3 rounded-lg break-words line-clamp-2">
      {value || "-"}
    </dd>
  </div>
);

/**
 * Komponen untuk menampilkan preview foto lokasi.
 * Menggunakan logic proxy untuk keamanan dan mendukung fullscreen modal.
 */
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

  // State untuk mengontrol modal fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // Fetch logic
  useEffect(() => {
    let mounted = true;
    setPreviewUrl(null);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (!fileKey) return;

    (async () => {
      // Menggunakan perbaikan dari langkah sebelumnya (memanggil dengan mode proxy yang benar)
      const res = await fetchFile(ulokId, { mode: "proxy" });

      if (!mounted) return;

      if (res instanceof Blob) {
        const url = URL.createObjectURL(res);
        setObjectUrl(url);
        setPreviewUrl(url);
        return;
      }

      if (typeof res === "string") {
        setPreviewUrl(res);
        return;
      }

      setPreviewUrl(null);
    })();

    return () => {
      mounted = false;
    };
  }, [ulokId, fileKey, fetchFile]);

  // Fungsi untuk menutup modal saat tombol Escape ditekan
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Thumbnail Container */}
      <div
        className={`relative aspect-video rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50 group ${
          previewUrl ? "cursor-pointer hover:opacity-95 transition-opacity" : ""
        }`}
        onClick={() => previewUrl && setIsFullscreen(true)}
      >
        {loading && <p className="text-gray-400 text-sm">Memuat foto...</p>}

        {error && (
          <p className="text-red-500 text-sm">Gagal memuat foto lokasi</p>
        )}

        {!loading && !previewUrl && !error && (
          <p className="text-gray-400 text-sm">Foto tidak tersedia</p>
        )}

        {previewUrl && (
          <>
            <Image
              src={previewUrl}
              alt="Foto Lokasi"
              fill
              className="object-cover"
              onError={() => {
                setPreviewUrl(null);
              }}
            />
            {/* Overlay icon maximize saat hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="text-white w-8 h-8 drop-shadow-md" />
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)} // Klik background untuk tutup
        >
          {/* Tombol Close */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <X size={24} />
          </button>

          {/* Gambar Fullscreen */}
          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Mencegah tutup saat klik gambar
          >
            <Image
              src={previewUrl}
              alt="Foto Lokasi Fullscreen"
              fill
              className="object-contain"
              quality={100}
              priority
            />
          </div>
        </div>
      )}
    </>
  );
};
