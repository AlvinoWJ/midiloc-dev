"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { UlokUpdateSchema, UlokUpdateInput } from "@/lib/validations/ulok";
import { StatusBadge } from "@/components/ui/statusbadge";
import { useUser } from "@/hooks/useUser";
import { CheckCircle2, FileText, ArrowLeft, Edit3, MapPin } from "lucide-react";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton"; // Pastikan path benar
import DetailMapCard from "@/components/ui/detailmapcard";
import MobileNavbar from "./navbar";
import MobileSidebar from "./sidebar";

// Interface Data & Props (Sama seperti kode dasar Anda)
interface UlokData {
  id: string;
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string;
  tanggalUlok: string;
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string;
  namapemilik: string;
  kontakpemilik: string;
  approval_status: string;
  file_intip: string | null;
  approval_intip: string | null;
  tanggal_approval_intip: string | null;
}
interface DetailUlokProps {
  initialData: UlokData;
  onSave: (data: UlokUpdateInput) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenIntipForm: () => void;
  onApprove: (status: "OK" | "NOK") => void;
  fileIntipUrl: string | null;
}

// Komponen DetailField (Diadaptasi untuk mobile)
const DetailField = ({
  label,
  value,
  isEditing,
  name,
  onChange,
  type = "text",
}: any) => (
  <div>
    <label className="text-gray-600 font-medium text-sm mb-1 block">
      {label}
    </label>
    {isEditing ? (
      type === "textarea" ? (
        <Textarea
          name={name}
          value={value}
          onChange={onChange}
          className="w-full text-sm"
          rows={2}
        />
      ) : (
        <Input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="w-full text-sm"
        />
      )
    ) : (
      <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-start w-full break-words">
        {value || "-"}
      </div>
    )}
  </div>
);

export default function MobileDetailUlokLayout(props: DetailUlokProps) {
  const {
    initialData,
    onSave,
    isSubmitting,
    onOpenIntipForm,
    onApprove,
    fileIntipUrl,
  } = props;

  // ===============================================
  // SEMUA STATE & LOGIKA DARI KODE DASAR ADA DI SINI
  // ===============================================
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  // --- LOGIKA OTORISASI ---
  const isLocationManager =
    user?.position_nama?.toLowerCase().trim() === "location manager";
  const isLocationSpecialist =
    user?.position_nama?.toLowerCase().trim() === "location specialist";
  const isIntipDone = !!initialData.file_intip;
  const isPendingApproval = initialData.approval_status === "In Progress";

  // --- FUNGSI HANDLER ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSaveWrapper = async () => {
    const dataToValidate = {
      nama_ulok: editedData.namaUlok,
      desa_kelurahan: editedData.kelurahan,
      kecamatan: editedData.kecamatan,
      kabupaten: editedData.kabupaten,
      provinsi: editedData.provinsi,
      alamat: editedData.alamat,
      format_store: editedData.formatStore,
      bentuk_objek: editedData.bentukObjek,
      alas_hak: editedData.alasHak,
      jumlah_lantai: editedData.jumlahlantai,
      lebar_depan: editedData.lebardepan,
      panjang: editedData.panjang,
      luas: editedData.luas,
      harga_sewa: editedData.hargasewa.replace(/[^0-9]/g, ""),
      nama_pemilik: editedData.namapemilik,
      kontak_pemilik: editedData.kontakpemilik,
    };
    const validationResult = UlokUpdateSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        formattedErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }
    const success = await onSave(validationResult.data);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedData(initialData);
    setErrors({});
    setIsEditing(false);
  };

  const handleApproveAction = async (status: "OK" | "NOK") => {
    if (!onApprove) return;
    setIsApproving(true);
    await onApprove(status);
    setIsApproving(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        isLoading={isSubmitting}
        isError={false}
      />

      <MobileNavbar
        onMenuClick={() => setIsSidebarOpen(true)}
        user={user}
        isLoading={isSubmitting}
        isError={false}
      />

      <main className="p-4 space-y-4">
        {/* OPSI 1: Minimalis & Fungsional */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="text-gray-700 rounded-full"
          >
            <ArrowLeft size={20} className="mr-2" />
            Kembali
          </Button>

          {isLocationSpecialist && isPendingApproval && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="default"
                    className="rounded-full"
                    onClick={handleCancel} // Menggunakan fungsi handleCancel yang benar
                  >
                    Batal
                  </Button>
                  <Button
                    variant="submit"
                    size="default"
                    className="rounded-full"
                    onClick={handleSaveWrapper} // Menggunakan fungsi handleSaveWrapper yang benar
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Menyimpan..." : <>Simpan</>}
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="default"
                  className="rounded-full"
                  onClick={() => setIsEditing(true)} // Menggunakan setIsEditing langsung
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 pr-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditing ? (
                  <Input
                    name="namaUlok"
                    value={editedData?.namaUlok || ""}
                    onChange={handleInputChange}
                    className="text-2xl font-bold border-2 border-gray-300 rounded px-3 py-2 focus:ring-0 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  />
                ) : (
                  editedData?.namaUlok || "-"
                )}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span>Dibuat Pada </span>
                <span className="ml-1">
                  {new Date(editedData?.tanggalUlok || "").toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>

            {/* Status badge dengan flex-shrink-0 agar tidak mengecil */}
            <div className="flex-shrink-0">
              <StatusBadge status={initialData.approval_status} />
            </div>
          </div>
        </div>
        {/* Data Usulan Lokasi Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <MapPin className="text-red-500 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Usulan Lokasi
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <DetailField
                label="Provinsi"
                value={editedData?.provinsi || ""}
                isEditing={isEditing}
                name="provinsi"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kabupaten/Kota"
                value={editedData?.kabupaten || ""}
                isEditing={isEditing}
                name="kabupaten"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kecamatan"
                value={editedData?.kecamatan || ""}
                isEditing={isEditing}
                name="kecamatan"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kelurahan/Desa"
                value={editedData?.kelurahan || ""}
                isEditing={isEditing}
                name="kelurahan"
                onChange={handleInputChange}
              />
            </div>
            <div className="mt-4">
              <DetailField
                label="Alamat"
                value={editedData?.alamat || ""}
                isEditing={isEditing}
                inputValue={editedData?.alamat || ""}
                inputType="textarea"
                name="alamat"
                onChange={handleInputChange}
              />
            </div>
            <div className="mt-4">
              <DetailField
                label="LatLong"
                value={editedData?.latlong || ""}
                isEditing={isEditing}
                inputValue={editedData?.latlong || ""}
                name="latlong"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        {/* Data Store Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <img
                src="/icons/store.png"
                alt="Logo Data Store"
                className="w-6 h-6 mr-3 object-contain"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Store
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <DetailField
                label="Format Store"
                value={editedData?.formatStore || ""}
                isEditing={isEditing}
                inputValue={editedData?.formatStore || ""}
                name="formatStore"
                onChange={handleInputChange}
              />
              <DetailField
                label="Bentuk Objek"
                value={editedData?.bentukObjek || ""}
                isEditing={isEditing}
                inputValue={editedData?.bentukObjek || ""}
                name="bentukObjek"
                onChange={handleInputChange}
              />
              <DetailField
                label="Alas Hak"
                value={editedData?.alasHak || ""}
                isEditing={isEditing}
                inputValue={editedData?.alasHak || ""}
                name="alasHak"
                onChange={handleInputChange}
              />
              <DetailField
                label="Jumlah Lantai"
                value={editedData?.jumlahlantai || ""}
                isEditing={isEditing}
                inputValue={editedData?.jumlahlantai || ""}
                inputType="number"
                name="jumlahlantai"
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
              <DetailField
                label="Lebar Depan"
                value={`${editedData?.lebardepan || ""} m`}
                isEditing={isEditing}
                inputValue={editedData?.lebardepan || ""}
                inputType="number"
                name="lebardepan"
                onChange={handleInputChange}
              />
              <DetailField
                label="Panjang"
                value={`${editedData?.panjang || ""} m`}
                isEditing={isEditing}
                inputValue={editedData?.panjang || ""}
                inputType="number"
                name="panjang"
                onChange={handleInputChange}
              />
              <DetailField
                label="Luas"
                value={`${editedData?.luas || ""} m2`}
                isEditing={isEditing}
                inputValue={editedData?.luas || ""}
                inputType="number"
                name="luas"
                onChange={handleInputChange}
              />
            </div>
            <div className="mt-4">
              <DetailField
                label="Harga Sewa (+PPH 10%)"
                value={editedData?.hargasewa || ""}
                isEditing={isEditing}
                inputValue={editedData?.hargasewa || ""}
                name="hargasewa"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        {/* Data Pemilik Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <img
                src="/icons/profil2.png"
                alt="Logo Data Store"
                className="w-6 h-6 mr-3 object-contain"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Pemilik
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <DetailField
                label="Nama Pemilik"
                value={editedData?.namapemilik || ""}
                isEditing={isEditing}
                inputValue={editedData?.namapemilik || ""}
                name="namapemilik"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kontak Pemilik"
                value={editedData?.kontakpemilik || ""}
                isEditing={isEditing}
                inputValue={editedData?.kontakpemilik || ""}
                name="kontakpemilik"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <DetailMapCard id={initialData.id} />
        {/* Tampilkan kartu approval JIKA intip sudah selesai */}
        {isIntipDone && (
          <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center">
                <CheckCircle2 className="text-green-600 mr-3" size={18} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Data Approval INTIP
                </h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Status & Tanggal */}
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Status INTIP"
                  value={initialData.approval_intip || "-"}
                  isEditing={false}
                />
                <DetailField
                  label="Tanggal Approval"
                  value={
                    initialData.tanggal_approval_intip
                      ? new Date(
                          initialData.tanggal_approval_intip
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"
                  }
                  isEditing={false}
                />
              </div>

              {/* Bukti Approval (File Preview) */}
              <div>
                <p className="text-gray-600 font-medium text-sm mb-2 block">
                  Bukti Approval
                </p>
                {fileIntipUrl ? (
                  (() => {
                    const isImage =
                      initialData.file_intip &&
                      /\.(jpeg|jpg|gif|png|webp)$/i.test(
                        initialData.file_intip
                      );

                    if (isImage) {
                      return (
                        <a
                          href={fileIntipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={fileIntipUrl}
                            alt="Preview Bukti Approval"
                            className="rounded-lg shadow-md w-full max-h-48 object-contain border border-gray-200"
                          />
                        </a>
                      );
                    } else {
                      return (
                        <a
                          href={fileIntipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Lihat File: {initialData.file_intip}</span>
                        </a>
                      );
                    }
                  })()
                ) : (
                  <p className="text-sm text-gray-400 italic">Memuat file...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isLocationManager && isPendingApproval && (
          <div className="mt-6">
            {!isIntipDone ? (
              <Button
                onClick={onOpenIntipForm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
                disabled={isSubmitting}
              >
                Input Data Intip
              </Button>
            ) : (
              <ApprovalStatusbutton
                currentStatus={initialData.approval_status}
                show={true}
                fileUploaded={true}
                onApprove={handleApproveAction}
                loading={isApproving}
                disabled={isApproving}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
