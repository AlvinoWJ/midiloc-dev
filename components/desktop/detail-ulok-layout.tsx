"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { MapPin, CheckCircle2, FileText, ArrowLeft, Edit3 } from "lucide-react";
import { StatusBadge } from "@/components/ui/statusbadge";
import { useUser } from "@/hooks/useUser";
import DetailMapCard from "@/components/ui/DetailMapCard";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { useSidebar } from "@/hooks/useSidebar";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton";
import { useDetailUlokForm } from "@/hooks/useDetailUlokForm";
import { MappedUlokData } from "@/hooks/useUlokDetail";
import CustomSelect from "@/components/ui/customselect";
import WilayahSelector from "@/components/desktop/wilayahselector";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import { Dialog } from "@headlessui/react";
import dynamic from "next/dynamic";

// Dynamic import untuk komponen peta agar tidak render di sisi server
const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

interface DetailUlokLayoutProps {
  initialData: MappedUlokData;
  onSave: (data: UlokUpdateInput) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenIntipForm: () => void;
  onApprove: (status: "OK" | "NOK") => void;
  fileIntipUrl: string | null;
}

// Komponen untuk menampilkan data saat tidak dalam mode edit
const DetailField = ({ label, value }: { label: string; value: any }) => (
  <div className="mb-4">
    <label className="text-gray-600 font-medium text-sm mb-2 block">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-sm bg-gray-50 rounded px-3 min-h-[40px] flex items-center w-full break-words">
      {value || "-"}
    </div>
  </div>
);

export default function DetailUlokLayout(props: DetailUlokLayoutProps) {
  const {
    initialData,
    onSave,
    isSubmitting,
    onOpenIntipForm,
    onApprove,
    fileIntipUrl,
  } = props;
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false); // State untuk modal peta

  const {
    isEditing,
    setIsEditing,
    editedData,
    errors,
    handleInputChange,
    handleSelectChange,
    handleSaveWrapper,
    handleCancel,
  } = useDetailUlokForm(initialData, onSave);

  const isLocationManager =
    user?.position_nama?.toLowerCase().trim() === "location manager";
  const isLocationSpecialist =
    user?.position_nama?.toLowerCase().trim() === "location specialist";
  const isIntipDone = !!initialData.file_intip;
  const isPendingApproval = initialData.approval_status === "In Progress";

  const formatStoreOptions = ["Reguler", "Super", "Spesifik", "Franchise"];
  const bentukObjekOptions = ["Tanah", "Bangunan"];
  const alasHakOptions = [
    { label: "Ya", value: "true" },
    { label: "Tidak", value: "false" },
  ];

  const handleApproveAction = async (status: "OK" | "NOK") => {
    if (!onApprove) return;
    setIsApproving(true);
    await onApprove(status);
    setIsApproving(false);
  };

  // Handler untuk menerima koordinat dari modal peta
  const handleMapSelect = (lat: number, lng: number) => {
    const latlongValue = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    // Buat event buatan untuk disimulasikan ke handleInputChange
    const event = {
      target: { name: "latlong", value: latlongValue, type: "text" },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    setIsMapOpen(false);
  };

  return (
    <>
      <div className="flex">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
            isCollapsed ? "ml-[80px]" : "ml-[270px]"
          }`}
        >
          <Navbar />
          <main className="flex-1 p-4 md:p-6 hide-scrollbar">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <Button onClick={() => router.back()} variant="back">
                  <ArrowLeft size={20} className="mr-1" />
                  Kembali
                </Button>

                {!isEditing && isLocationSpecialist && isPendingApproval && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-2 font-medium flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit
                  </Button>
                )}
              </div>

              {/* Header Info */}
              <div className="bg-white rounded p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 pr-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {isEditing ? (
                        <Input
                          name="namaUlok"
                          value={editedData?.namaUlok || ""}
                          onChange={handleInputChange}
                          className="text-2xl font-bold"
                          placeholder="Masukkan nama ULOK"
                        />
                      ) : (
                        editedData?.namaUlok || "-"
                      )}
                    </h1>
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                      <span>Dibuat Pada </span>
                      <span className="ml-1">
                        {new Date(
                          editedData?.tanggalUlok || ""
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={initialData.approval_status} />
                  </div>
                </div>
              </div>

              {/* FORM UTAMA */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveWrapper();
                }}
                className="space-y-10"
              >
                {/* --- KARTU DATA LOKASI --- */}
                <div className="relative">
                  <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
                    Data Lokasi
                  </div>
                  <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-4">
                    {isEditing ? (
                      <>
                        <WilayahSelector
                          onWilayahChange={handleSelectChange}
                          errors={errors}
                          initialProvince={editedData?.provinsi}
                          initialRegency={editedData?.kabupaten}
                          initialDistrict={editedData?.kecamatan}
                          initialVillage={editedData?.kelurahan}
                        />
                        <div>
                          <label
                            htmlFor="alamat"
                            className="block font-semibold mb-1"
                          >
                            Alamat <span className="text-red-500">*</span>
                          </label>
                          <Textarea
                            id="alamat"
                            name="alamat"
                            placeholder="Masukkan alamat lengkap"
                            value={editedData.alamat}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="latlong"
                              className="block font-bold mb-1"
                            >
                              LatLong <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="latlong"
                                name="latlong"
                                placeholder="Masukkan LatLong"
                                value={`${editedData.latitude ?? ""}, ${
                                  editedData.longitude ?? ""
                                }`}
                                onChange={handleInputChange}
                                className="flex-grow"
                              />
                              <button
                                type="button"
                                onClick={() => setIsMapOpen(true)}
                                className="p-2 border border-gray-300 rounded hover:bg-gray-100 flex-shrink-0"
                              >
                                <MapPin className="text-red-500" size={18} />
                              </button>
                            </div>
                            {/* --- PENAMBAHAN CATATAN PETA --- */}
                            <p className="mt-2 text-xs text-gray-500 italic">
                              <strong>Catatan:</strong> Jika ikon peta tidak
                              berfungsi, masukkan koordinat manual dengan
                              format:
                              <br />
                              <code className="bg-gray-200 px-1 rounded">
                                -6.2257, 106.6570
                              </code>{" "}
                              (Latitude Y, Longitude X).
                            </p>
                            {/* --- AKHIR PENAMBAHAN --- */}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <DetailField
                          label="Provinsi"
                          value={editedData?.provinsi}
                        />
                        <DetailField
                          label="Kabupaten/Kota"
                          value={editedData?.kabupaten}
                        />
                        <DetailField
                          label="Kecamatan"
                          value={editedData?.kecamatan}
                        />
                        <DetailField
                          label="Kelurahan/Desa"
                          value={editedData?.kelurahan}
                        />
                        <div className="md:col-span-2">
                          <DetailField
                            label="Alamat"
                            value={editedData?.alamat}
                          />
                        </div>
                        <DetailField
                          label="LatLong"
                          value={`${editedData.latitude ?? ""}, ${
                            editedData.longitude ?? ""
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* --- KARTU DATA STORE --- */}
                <div className="relative">
                  <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
                    Data Store
                  </div>
                  <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CustomSelect
                            id="formatStore"
                            name="formatStore"
                            label="Format Store"
                            placeholder="Pilih Format Store"
                            value={editedData.formatStore}
                            options={formatStoreOptions}
                            onChange={(e) =>
                              handleSelectChange("formatStore", e.target.value)
                            }
                            error={errors.formatStore}
                          />
                          <CustomSelect
                            id="bentukObjek"
                            name="bentukObjek"
                            label="Bentuk Objek"
                            placeholder="Pilih Bentuk Objek"
                            value={editedData.bentukObjek}
                            options={bentukObjekOptions}
                            onChange={(e) =>
                              handleSelectChange("bentukObjek", e.target.value)
                            }
                            error={errors.bentukObjek}
                          />
                          <CustomSelect
                            id="alasHak"
                            name="alasHak"
                            label="Alas Hak"
                            placeholder="Pilih Alas Hak"
                            value={String(editedData.alasHak)}
                            options={alasHakOptions.map((opt) => opt.value)}
                            getOptionLabel={(opt) =>
                              alasHakOptions.find((o) => o.value === opt)
                                ?.label ?? ""
                            }
                            onChange={(e) =>
                              handleSelectChange("alasHak", e.target.value)
                            }
                            error={errors.alasHak}
                          />
                          <div>
                            <label
                              htmlFor="jumlahlantai"
                              className="block font-semibold mb-1"
                            >
                              Jumlah Lantai{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="jumlahlantai"
                              name="jumlahlantai"
                              type="number"
                              placeholder="Masukkan Jumlah Lantai"
                              value={editedData.jumlahlantai ?? ""}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label
                              htmlFor="lebardepan"
                              className="block font-bold mb-1"
                            >
                              Lebar Depan(m){" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="lebardepan"
                              name="lebardepan"
                              type="number"
                              placeholder="Masukkan Lebar Depan"
                              value={editedData.lebardepan ?? ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="panjang"
                              className="block font-bold mb-1"
                            >
                              Panjang(m) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="panjang"
                              name="panjang"
                              type="number"
                              placeholder="Masukkan Panjang"
                              value={editedData.panjang ?? ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="luas"
                              className="block font-bold mb-1"
                            >
                              Luas(m) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="luas"
                              name="luas"
                              type="number"
                              placeholder="Masukkan Luas"
                              value={editedData.luas ?? ""}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="hargasewa"
                            className="block font-bold mb-1"
                          >
                            Harga Sewa (+PPH 10%){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="hargasewa"
                            name="hargasewa"
                            placeholder="Masukkan Harga Sewa"
                            value={editedData.hargasewa}
                            onChange={handleInputChange}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                          <DetailField
                            label="Format Store"
                            value={editedData?.formatStore}
                          />
                          <DetailField
                            label="Bentuk Objek"
                            value={editedData?.bentukObjek}
                          />
                          <DetailField
                            label="Alas Hak"
                            value={String(editedData?.alasHak)}
                          />
                          <DetailField
                            label="Jumlah Lantai"
                            value={editedData?.jumlahlantai}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
                          <DetailField
                            label="Lebar Depan"
                            value={editedData?.lebardepan}
                          />
                          <DetailField
                            label="Panjang"
                            value={editedData?.panjang}
                          />
                          <DetailField
                            label="Luas"
                            value={editedData?.luas}
                          />
                        </div>
                        <DetailField
                          label="Harga Sewa (+PPH 10%)"
                          value={editedData?.hargasewa}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* --- KARTU DATA PEMILIK --- */}
                <div className="relative">
                  <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
                    Data Pemilik
                  </div>
                  <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label
                            htmlFor="namapemilik"
                            className="block font-bold mb-1"
                          >
                            Nama Pemilik{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="namapemilik"
                            name="namapemilik"
                            placeholder="Masukkan Nama Pemilik"
                            value={editedData.namapemilik}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="kontakpemilik"
                            className="block font-bold mb-1"
                          >
                            Kontak Pemilik{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="kontakpemilik"
                            name="kontakpemilik"
                            placeholder="Masukkan Kontak Pemilik"
                            value={editedData.kontakpemilik}
                            onChange={handleInputChange}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <DetailField
                          label="Nama Pemilik"
                          value={editedData?.namapemilik}
                        />
                        <DetailField
                          label="Kontak Pemilik"
                          value={editedData?.kontakpemilik}
                        />
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end items-center gap-3 mt-8">
                    <Button
                      type="button"
                      variant="back"
                      onClick={handleCancel}
                      className="px-8"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="submit"
                      disabled={isSubmitting}
                      className="px-8"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                )}
              </form>

              {!isEditing && (
                <>
                  <DetailMapCard id={initialData.id} />

                  {isIntipDone && (
                    <section className="bg-white rounded shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mt-8">
                      <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center">
                          <CheckCircle2
                            className="text-green-600 mr-3"
                            size={20}
                          />
                          <h2 className="text-lg font-semibold text-gray-900">
                            Data Approval INTIP
                          </h2>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <DetailField
                            label="Status INTIP"
                            value={initialData.approval_intip || "-"}
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
                          />
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-gray-600 font-medium text-sm mb-2 block">
                              Bukti Approval
                            </p>
                            {fileIntipUrl &&
                              (() => {
                                const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(
                                  initialData.file_intip || ""
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
                                        className="rounded shadow-md max-w-xs max-h-60 object-contain border"
                                      />
                                    </a>
                                  );
                                } else {
                                  return (
                                    <a
                                      href={fileIntipUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span>
                                        Lihat File: {initialData.file_intip}
                                      </span>
                                    </a>
                                  );
                                }
                              })()}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {isLocationManager && isPendingApproval && (
                    <div className="mt-8 flex justify-end">
                      {!isIntipDone ? (
                        <Button
                          onClick={onOpenIntipForm}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3"
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
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modal Peta */}
      <Dialog
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl h-[80vh] bg-white rounded shadow-xl overflow-hidden">
            <div className="p-4 border-b">
              <Dialog.Title className="text-lg font-medium">
                Pilih Lokasi dari Peta
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                Klik pada peta untuk memilih koordinat.
              </p>
            </div>
            <div className="h-[calc(100%-80px)]">
              {isMapOpen && <LocationPickerModal onConfirm={handleMapSelect} />}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
