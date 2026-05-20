import { useState } from "react";
import axios from "axios";

export default function PricingUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState("");

  const uploadFile = async () => {
    if (!password.trim()) {
      setMessage("Please enter upload password.");
      return;
    }

    if (!file) {
      setMessage("Please select an Excel file.");
      return;
    }

    if (!file.name.endsWith(".xlsx")) {
      setMessage("Only .xlsx files are allowed.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      const res = await axios.post(
        "http://localhost:5000/api/upload-pricing",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message || "Uploaded successfully.");

    } catch (err) {
      console.error(err);

      setMessage(
        err.response?.data?.message ||
          "Upload failed. Please try again."
      );

    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">
          Upload freight rates Sheet
        </h1>

        <p className="text-gray-600 mb-6">
          Upload the latest freight rates Excel file. Only .xlsx files are allowed.
        </p>

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Upload Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[#D9E1EC] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
        />

        {/* FILE */}
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border border-[#D9E1EC] rounded-lg px-4 py-3 mb-4"
        />

        {/* BUTTON */}
        <button
          onClick={uploadFile}
          disabled={uploading}
          className="w-full bg-[#E87506] hover:bg-[#c86405] text-white py-3 rounded-xl font-semibold transition"
        >
          {uploading ? "Uploading..." : "Upload Excel"}
        </button>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mt-4 text-sm font-medium p-3 rounded-lg ${
              message.toLowerCase().includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}