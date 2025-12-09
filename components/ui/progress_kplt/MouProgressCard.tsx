"use client";

import React, { useState, useEffect } from "react";
import { useMouProgress } from "@/hooks/progress_kplt/useMouProgress";
import { Loader2, Pencil, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { ClipboardList } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { MouEditableSchema } from "@/lib/validations/mou";
import { useAlert } from "@/components/shared/alertcontext";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

/**
 * Helper: Format angka ke format ribuan Indonesia.
 * Contoh: 1000000 -> "1.000.000"
 */
const formatnumeric = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "";
  const numberValue =
    typeof value === "string"
      ? Number(value.replace(/\./g, ""))
      : Number(value);
  if (isNaN(numberValue)) return "";
  return new Intl.NumberFormat("id-ID").format(numberValue);
};

/**
 * Helper: Hapus format ribuan untuk kalkulasi/API.
 * Contoh: "1.000.000" -> 1000000
 */
const unformatnumeric = (value: string | undefined | null) => {
  if (!value) return undefined;
  const unformatted = value.replace(/\./g, "");
  const numberValue = Number(unformatted);
  return isNaN(numberValue) ? undefined : numberValue;
};

interface MouFormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onDataUpdate: () => void;
}

/**
 * Komponen Wrapper UI untuk konsistensi tampilan kartu.
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
      <div className="flex items-center">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
    {/* Konten Kartu */}
    <div className="p-6">{children}</div>
  </div>
);

/**
 * Komponen Form: MouForm
 * Menangani input data MOU (Create & Edit).
 */
const MouForm: React.FC<MouFormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onCancelEdit,
  onDataUpdate,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();
  const { user } = useUser();

  // State lokal untuk input (terutama Select dan Formatted Number)
  const [statusPajak, setStatusPajak] = useState<string>(
    initialData?.status_pajak || ""
  );
  const [pembayaranPph, setPembayaranPph] = useState<string>(
    initialData?.pembayaran_pph || ""
  );
  const [caraPembayaran, setCaraPembayaran] = useState<string>(
    initialData?.cara_pembayaran || ""
  );

  // State khusus tampilan angka (formatted)
  const [displayNilaiSewa, setDisplayNilaiSewa] = useState<string>("");
  const [displayHargaFinal, setDisplayHargaFinal] = useState<string>("");
  const [displayPeriodeSewa, setDisplayPeriodeSewa] = useState<string>("");
  const [displayGracePeriod, setDisplayGracePeriod] = useState<string>("");

  // Efek untuk sinkronisasi data awal ke state lokal saat mode Edit
  useEffect(() => {
    if (initialData) {
      setDisplayNilaiSewa(formatnumeric(initialData.nilai_sewa));
      setDisplayHargaFinal(formatnumeric(initialData.harga_final));
      setDisplayPeriodeSewa(formatnumeric(initialData.periode_sewa));
      setDisplayGracePeriod(formatnumeric(initialData.grace_period));
    }
    setStatusPajak(initialData?.status_pajak || "");
    setPembayaranPph(initialData?.pembayaran_pph || "");
    setCaraPembayaran(initialData?.cara_pembayaran || "");
  }, [initialData]);

  // Opsi dropdown
  const statusPajakOptions = ["PKP", "NPKP"];
  const pembayaranPphOptions = [
    "Pemilik",
    "Perusahaan",
    "Pemilik dan Perusahaan",
  ];
  const caraPembayaranOptions = ["Sekaligus", "Bertahap"];

  // Handlers untuk Select Change
  const handleStatusPajakChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusPajak(e.target.value);
  };
  const handlePembayaranPphChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPembayaranPph(e.target.value);
  };
  const handleCaraPembayaranChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCaraPembayaran(e.target.value);
  };

  /**
   * Helper: Mengubah string kosong menjadi undefined.
   * Penting untuk Zod schema `.optional()`, agar tidak dianggap string kosong invalid.
   */
  const emptyToUndefined = (value: string | number | null) => {
    if (value === "" || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  };

  /**
   * Handler input angka: Hanya izinkan digit, lalu format ke ribuan.
   */
  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const { value } = e.target;
    const rawValue = value.replace(/\./g, "");
    if (!/^\d*$/.test(rawValue)) return;

    setter(formatnumeric(rawValue));
  };

  /**
   * Handler Simpan Data (Submit Form)
   */
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Unformat angka sebelum validasi
    const nilaiSewaUnformatted = unformatnumeric(displayNilaiSewa);
    const hargaFinalUnformatted = unformatnumeric(displayHargaFinal);
    const periodesewaUnformated = unformatnumeric(displayPeriodeSewa);
    const graceperiodUnformatted = unformatnumeric(displayGracePeriod);

    // Konstruksi payload dengan konversi tipe data
    const payload = {
      nama_pemilik_final: emptyToUndefined(
        formData.get("nama_pemilik_final") as string
      ),
      tanggal_mou: emptyToUndefined(formData.get("tanggal_mou") as string),
      status_pajak: emptyToUndefined(statusPajak),
      pembayaran_pph: emptyToUndefined(pembayaranPph),
      cara_pembayaran: emptyToUndefined(caraPembayaran),
      keterangan: emptyToUndefined(formData.get("keterangan") as string),
      // Konversi ke number, jika NaN maka undefined (atau empty string tergantung logic)
      periode_sewa: emptyToUndefined(Number(periodesewaUnformated) || ""),
      nilai_sewa: emptyToUndefined(Number(nilaiSewaUnformatted) || ""),
      grace_period: emptyToUndefined(Number(graceperiodUnformatted) || ""),
      harga_final: emptyToUndefined(Number(hargaFinalUnformatted) || ""),
    };

    // Validasi Zod
    const parsed = MouEditableSchema.safeParse(payload);
    if (!parsed.success) {
      console.error(parsed.error.format());
      showToast({
        type: "error",
        message: "Data tidak valid. Mohon periksa kembali input Anda.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(`/api/progress/${progressId}/mou`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || json.detail || json.error || "Gagal menyimpan data"
        );
      }

      onDataUpdate();
      showToast({
        type: "success",
        message: `Data MOU berhasil di${initialData ? "update" : "simpan"}.`,
      });
      onSuccess();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast({
        type: "error",
        title: "Gagal",
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailCard
      title="MOU"
      icon={<ClipboardList className="text-red-500 mr-3" size={20} />}
      className=""
    >
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Input Tanggal MOU */}
        <div>
          <label
            htmlFor="tanggal_mou"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal MOU
          </label>
          <Input
            id="tanggal_mou"
            name="tanggal_mou"
            type="date"
            defaultValue={initialData?.tanggal_mou || ""}
            className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer pr-10"
          />
        </div>
        <div>
          <label
            htmlFor="nama_pemilik_final"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Nama Pemilik
          </label>
          <Input
            id="nama_pemilik_final"
            name="nama_pemilik_final"
            placeholder="Masukkan nama pemilik"
            defaultValue={initialData?.nama_pemilik_final || ""}
          />
        </div>
        {/* Input Periode Sewa (Numeric) */}
        <div>
          <label
            htmlFor="periode_sewa"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Periode Sewa (tahun)
          </label>
          <Input
            id="periode_sewa"
            name="periode_sewa"
            inputMode="numeric"
            placeholder="Masukkan periode sewa"
            value={displayPeriodeSewa}
            onChange={(e) => handleNumericInputChange(e, setDisplayPeriodeSewa)}
          />
        </div>
        {/* Input Nilai Sewa (Numeric) */}
        <div>
          <label
            htmlFor="nilai_sewa"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Nilai Sewa (Rp)
          </label>
          <Input
            id="nilai_sewa"
            name="nilai_sewa"
            inputMode="numeric"
            value={displayNilaiSewa}
            onChange={(e) => handleNumericInputChange(e, setDisplayNilaiSewa)}
            placeholder="Masukkan nilai sewa"
          />
        </div>

        {/* Select Inputs */}
        <div>
          <CustomSelect
            id="status_pajak"
            name="status_pajak"
            label="Status Pajak"
            placeholder="Pilih status pajak"
            value={statusPajak}
            options={statusPajakOptions}
            onChange={handleStatusPajakChange}
          />
        </div>
        <div>
          <CustomSelect
            id="pembayaran_pph"
            name="pembayaran_pph"
            label="Pembayaran PPh"
            placeholder="Pilih pembayaran PPh"
            value={pembayaranPph}
            options={pembayaranPphOptions}
            onChange={handlePembayaranPphChange}
          />
        </div>
        <div>
          <CustomSelect
            id="cara_pembayaran"
            name="cara_pembayaran"
            label="Cara Pembayaran"
            placeholder="Pilih cara pembayaran"
            value={caraPembayaran}
            options={caraPembayaranOptions}
            onChange={handleCaraPembayaranChange}
          />
        </div>

        {/* Grace Period & Harga Final */}
        <div>
          <label
            htmlFor="grace_period"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Grace Period (bulan)
          </label>
          <Input
            id="grace_period"
            name="grace_period"
            inputMode="numeric"
            placeholder="Masukkan grace period"
            value={displayGracePeriod}
            onChange={(e) => handleNumericInputChange(e, setDisplayGracePeriod)}
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="harga_final"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Harga Final (Rp)
          </label>
          <Input
            id="harga_final"
            name="harga_final"
            value={displayHargaFinal}
            inputMode="numeric"
            onChange={(e) => handleNumericInputChange(e, setDisplayHargaFinal)}
            placeholder="Masukkan harga final"
          />
        </div>

        {/* Keterangan */}
        <div className="md:col-span-2">
          <label
            htmlFor="keterangan"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Keterangan
          </label>
          <Textarea
            id="keterangan"
            name="keterangan"
            defaultValue={initialData?.keterangan || ""}
          />
        </div>

        {/* Tombol Aksi Form */}
        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
          {onCancelEdit && (
            <Button
              variant="default"
              onClick={onCancelEdit}
              type="button"
              className="min-w-30"
            >
              <XCircle className="mr-2" size={16} />
              Batal
            </Button>
          )}
          <Button
            type="submit"
            variant="submit"
            disabled={isSubmitting}
            className="min-w-30"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <CheckCircle className="mr-2" size={16} />
            )}
            Simpan
          </Button>
        </div>
      </form>
    </DetailCard>
  );
};

interface MouProgressCardProps {
  progressId: string;
  onDataUpdate: () => void;
}

/**
 * Komponen Utama: MouProgressCard
 * Mengatur tampilan View/Edit dan Final Approval.
 */
const MouProgressCard: React.FC<MouProgressCardProps> = ({
  progressId,
  onDataUpdate,
}) => {
  const router = useRouter();

  const { data, loading, error, refetch } = useMouProgress(progressId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  // RBAC: Cek admin branch
  const { user } = useUser();
  const isBranchAdmin = user?.position_nama === "admin branch";

  /**
   * Handler untuk Final Approval (Selesai/Batal).
   * Mengunci data setelah dieksekusi.
   */
  const handleFinalizeMou = async (status: "Selesai" | "Batal") => {
    const actionText = status === "Selesai" ? "submit" : "batalkan";
    const actionTitle = status === "Selesai" ? "Submit" : "Pembatalan";
    const confirmText = status === "Selesai" ? "Ya, Submit" : "Ya, Batalkan";

    const isConfirmed = await showConfirmation({
      title: `Konfirmasi ${actionTitle} MOU`,
      message: `Apakah Anda yakin ingin ${actionText} MOU ini? Data yang sudah di-${actionText} tidak dapat diubah kembali.`,
      confirmText: confirmText,
      type: "warning",
    });

    if (!isConfirmed) return;

    if (status === "Selesai") {
      setIsSubmittingApprove(true);
    } else {
      setIsSubmittingReject(true);
    }

    try {
      const apiStatus = status.toLowerCase() as "selesai" | "batal";
      const payload = { final_status_mou: apiStatus };

      const res = await fetch(`/api/progress/${progressId}/mou/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        let errorTitle = "Gagal Mengirim";
        let errorMessage = json.error || "Gagal melakukan submit.";

        // Handle validasi backend khusus (misal data belum lengkap)
        if (
          res.status === 422 &&
          json.missing_fields &&
          json.missing_fields.length > 0
        ) {
          errorTitle = "Data Belum Lengkap";
          errorMessage = `Field berikut harus diisi: ${json.missing_fields.join(
            ", "
          )}`;
        }
        showToast({
          type: "error",
          title: errorTitle,
          message: errorMessage,
        });
        return;
      }
      onDataUpdate();
      showToast({
        type: "success",
        message: `MOU berhasil di-${actionText}.`,
      });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast({
        type: "error",
        title: "Terjadi Kesalahan",
        message: err.message || "Tidak dapat terhubung ke server.",
      });
    } finally {
      // Reset loading state
      setIsSubmittingApprove(false);
      setIsSubmittingReject(false);
    }
  };

  /* --- KONDISI LOADING & ERROR --- */
  if (loading)
    return (
      <div className="flex justify-center py-10 mt-8 w-full ">
        <Loader2 className="animate-spin text-gray-500" size={28} />
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center py-5 mt-8 w-full ">
        Terjadi kesalahan: {error}
      </div>
    );

  /* --- KONDISI EDIT MODE --- */
  if (!data || isEditing) {
    return (
      <div className="w-full ">
        <MouForm
          progressId={progressId}
          onSuccess={() => {
            refetch();
            setIsEditing(false);
          }}
          initialData={data}
          isEditMode={!!data}
          onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
          onDataUpdate={onDataUpdate}
        />
      </div>
    );
  }

  // Cek Status Final
  const isFinalized =
    data.final_status_mou === "Selesai" || data.final_status_mou === "Batal";

  /* --- KONDISI VIEW MODE (Read Only) --- */
  return (
    <div className="w-full ">
      <DetailCard
        title="MOU"
        icon={<ClipboardList className="text-red-500 mr-3" size={20} />}
        className=""
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tampilan Data Read Only */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Tanggal MOU
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.tanggal_mou || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Nama Pemilik
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.nama_pemilik_final || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Periode Sewa (tahun)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.periode_sewa || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Nilai Sewa (Rp)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {/* Format Rupiah */}
              Rp {data.nilai_sewa?.toLocaleString("id-ID") || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Status Pajak
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.status_pajak || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Pembayaran PPh
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.pembayaran_pph || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Cara Pembayaran
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.cara_pembayaran || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Grace Period (bulan)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.grace_period || "-"}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Harga Final (Rp)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              Rp {data.harga_final?.toLocaleString("id-ID") || "-"}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Keterangan
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base min-h-[60px]">
              {data.keterangan || "-"}
            </div>
          </div>
        </div>

        {/* Action Buttons: Muncul jika admin branch & belum final */}
        {!isFinalized && isBranchAdmin && (
          <div className="flex gap-3 mt-8">
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              disabled={isSubmittingApprove || isSubmittingReject}
              className="mr-auto"
            >
              <Pencil className="mr-2" size={16} /> Edit
            </Button>
            <Button
              variant="default"
              onClick={() => handleFinalizeMou("Batal")}
              disabled={isSubmittingApprove || isSubmittingReject}
            >
              {isSubmittingReject ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <XCircle className="mr-2" size={16} />
              )}
              Batal
            </Button>
            <Button
              type="submit"
              variant="submit"
              onClick={() => handleFinalizeMou("Selesai")}
              disabled={isSubmittingApprove || isSubmittingReject}
            >
              {isSubmittingApprove ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle className="mr-2" size={16} />
              )}{" "}
              Submit
            </Button>
          </div>
        )}
      </DetailCard>
    </div>
  );
};

export default MouProgressCard;
