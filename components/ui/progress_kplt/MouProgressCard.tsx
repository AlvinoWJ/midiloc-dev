"use client";

import React, { useState } from "react";
import { useMouProgress } from "@/hooks/progress_kplt/useMouProgress";
import { Loader2, Pencil, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { ClipboardList } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { MouEditableSchema } from "@/lib/validations/mou";
import { useAlert } from "@/components/shared/alertcontext";
import { ProgressStatusCard } from "./ProgressStatusCard";

interface MouFormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
}

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

const MouForm: React.FC<MouFormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onCancelEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();

  const [statusPajak, setStatusPajak] = useState<string>(
    initialData?.status_pajak || ""
  );
  const [pembayaranPph, setPembayaranPph] = useState<string>(
    initialData?.pembayaran_pph || ""
  );
  const [caraPembayaran, setCaraPembayaran] = useState<string>(
    initialData?.cara_pembayaran || ""
  );

  const statusPajakOptions = ["PKP", "NPKP"];

  const pembayaranPphOptions = [
    "Pemilik",
    "Perusahan",
    "Pemilik dan Perusahaan",
  ];

  const caraPembayaranOptions = ["Sekaligus", "Bertahap"];

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

  const emptyToUndefined = (value: string | number | null) => {
    if (value === "" || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const payload = {
      nama_pemilik_final: emptyToUndefined(
        formData.get("nama_pemilik_final") as string
      ),
      tanggal_mou: emptyToUndefined(formData.get("tanggal_mou") as string),
      status_pajak: emptyToUndefined(statusPajak),
      pembayaran_pph: emptyToUndefined(pembayaranPph),
      cara_pembayaran: emptyToUndefined(caraPembayaran),
      keterangan: emptyToUndefined(formData.get("keterangan") as string),
      periode_sewa: emptyToUndefined(
        Number(formData.get("periode_sewa")) || ""
      ),
      nilai_sewa: emptyToUndefined(Number(formData.get("nilai_sewa")) || ""),
      grace_period: emptyToUndefined(
        Number(formData.get("grace_period")) || ""
      ),
      harga_final: emptyToUndefined(Number(formData.get("harga_final")) || ""),
    };

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
        const errMsg =
          json.detail?.[0]?.message || json.error || "Gagal menyimpan data";
        throw new Error(errMsg);
      }
      showToast({
        type: "success",
        message: `Data MOU berhasil di${initialData ? "update" : "simpan"}.`,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showToast({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailCard
      title="MOU"
      icon={<ClipboardList className="text-red-500 mr-3" size={20} />}
      className="mt-10"
    >
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
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
            defaultValue={initialData?.nama_pemilik_final || ""}
          />
        </div>
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
            type="number"
            defaultValue={initialData?.periode_sewa || ""}
          />
        </div>
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
            type="number"
            defaultValue={initialData?.nilai_sewa || ""}
          />
        </div>
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
            type="number"
            defaultValue={initialData?.grace_period || ""}
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
            type="number"
            defaultValue={initialData?.harga_final || ""}
          />
        </div>
        {/* Full width */}
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

        <div className="md:col-span-2 flex justify-end gap-3 mt-6">
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
}

const MouProgressCard: React.FC<MouProgressCardProps> = ({ progressId }) => {
  const { data, loading, error, refetch } = useMouProgress(progressId);
  const [isEditing, setIsEditing] = useState(false);

  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const { showToast, showConfirmation } = useAlert();

  const handleFinalizeMou = async (status: "Selesai" | "Batal") => {
    const actionText = status === "Selesai" ? "submit" : "membatalkan";
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

      const res = await fetch(
        `/api/progress/${progressId}/mou/approval`, // URL diperbaiki
        {
          method: "PATCH", // Method diperbaiki
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), // Body ditambahkan
        }
      );

      const json = await res.json();

      if (!res.ok) {
        let errorTitle = "Gagal Mengirim";
        let errorMessage = json.error || "Gagal melakukan submit.";

        // ‹- PERBAIKAN 1: Pesan error dibuat lebih spesifik
        if (
          res.status === 422 &&
          json.missing_fields &&
          json.missing_fields.length > 0
        ) {
          errorTitle = "Data Belum Lengkap";
          // Tampilkan field apa saja yang kurang
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

      showToast({
        type: "success",
        // ‹- PERBAIKAN 2: Pesan sukses dinamis sesuai 'actionText'
        message: `MOU berhasil di-${actionText}.`,
      });
      await refetch();
    } catch (err: any) {
      console.error(err);
      // Tampilkan toast error jika ada kesalahan 'catch'
      showToast({
        type: "error",
        title: "Terjadi Kesalahan",
        message: err.message || "Tidak dapat terhubung ke server.",
      });
    } finally {
      // ‹- PERBAIKAN 3 (UTAMA): Selalu reset KEDUA state
      setIsSubmittingApprove(false);
      setIsSubmittingReject(false);
    }
  };

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

  console.log("Created At:", data?.created_at);
  console.log("Status:", data?.final_status_mou);
  console.log("Tanggal Selesai:", data?.tgl_selesai_mou);

  if (!data || isEditing) {
    return (
      <div className="w-full ">
        <ProgressStatusCard
          title="MOU"
          status={data?.final_status_mou}
          startDate={data?.created_at}
          endDate={data?.tgl_selesai_mou}
        />
        <MouForm
          progressId={progressId}
          onSuccess={() => {
            refetch();
            setIsEditing(false);
          }}
          initialData={data}
          isEditMode={!!data}
          onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
        />
      </div>
    );
  }

  const isFinalized =
    data.final_status_mou === "Selesai" || data.final_status_mou === "Batal";

  // Mode Read - Tampilkan data
  return (
    <div className="w-full ">
      <ProgressStatusCard
        title="MOU"
        status={data.final_status_mou}
        startDate={data.created_at}
        endDate={data.tgl_selesai_mou}
      />
      <DetailCard
        title="MOU"
        icon={<ClipboardList className="text-red-500 mr-3" size={20} />}
        className="mt-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tanggal MOU */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Tanggal MOU
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.tanggal_mou || "-"}
            </div>
          </div>

          {/* Nama Pemilik */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Nama Pemilik
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.nama_pemilik_final || "-"}
            </div>
          </div>

          {/* Periode Sewa */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Periode Sewa (tahun)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.periode_sewa || "-"}
            </div>
          </div>

          {/* Nilai Sewa */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Nilai Sewa (Rp)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              Rp {data.nilai_sewa?.toLocaleString("id-ID") || "-"}
            </div>
          </div>

          {/* Status Pajak */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Status Pajak
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.status_pajak || "-"}
            </div>
          </div>

          {/* Pembayaran PPh */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Pembayaran PPh
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.pembayaran_pph || "-"}
            </div>
          </div>

          {/* Cara Pembayaran */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Cara Pembayaran
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.cara_pembayaran || "-"}
            </div>
          </div>

          {/* Grace Period */}
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Grace Period (bulan)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {data.grace_period || "-"}
            </div>
          </div>

          {/* Harga Final - Full Width */}
          <div className="md:col-span-2">
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Harga Final (Rp)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              Rp {data.harga_final?.toLocaleString("id-ID") || "-"}
            </div>
          </div>

          {/* Keterangan - Full Width */}
          <div className="md:col-span-2">
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Keterangan
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base min-h-[60px]">
              {data.keterangan || "-"}
            </div>
          </div>
        </div>

        {!isFinalized && (
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
