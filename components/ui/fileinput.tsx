import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";

// Anda bisa meletakkan ini di dalam komponen utama atau sebagai komponen terpisah
const FileInputModern = ({ label, formErrors, onFileChange, name }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onFileChange(e); // Meneruskan event ke form handler utama
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // Reset nilai input file
    document.getElementById(name).value = "";
  };

  const isImage = selectedFile && selectedFile.type.startsWith("image/");

  return (
    <div>
      <h2 className="block font-bold mb-2">
        {label} <span className="text-red-500">*</span>
      </h2>

      {/* Tampilkan Preview Jika File Sudah Dipilih */}
      {selectedFile && previewUrl ? (
        <div className="p-4 border border-gray-300 rounded-lg relative max-w-sm bg-gray-50">
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>

          {isImage ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-md w-full h-auto max-h-60 object-contain"
            />
          ) : (
            <div className="flex items-center gap-3 text-gray-700">
              <FileText size={32} className="text-gray-500 flex-shrink-0" />
              <span className="truncate font-medium">{selectedFile.name}</span>
            </div>
          )}
        </div>
      ) : (
        /* Tampilan Dropzone Jika Belum Ada File */
        <>
          <label
            htmlFor={name}
            className="flex flex-col items-center justify-center w-full p-8 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
              <Upload className="w-7 h-7 text-red-600" />
            </div>
            <p className="text-gray-700 font-medium">Upload file disini</p>
            <p className="text-sm text-gray-500 mt-1">
              PDF, DOC, JPG, PNG (Max 10MB)
            </p>
          </label>
          <input
            id={name}
            name={name}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}

      {/* Tampilkan pesan error jika ada */}
      {formErrors && <p className="text-red-500 text-sm mt-1">{formErrors}</p>}
    </div>
  );
};
