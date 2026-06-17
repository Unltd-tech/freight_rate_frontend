import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function PricingCalculator() {
  const [options, setOptions] = useState(null);
  const [freightType, setFreightType] = useState("Local");
  const [details, setDetails] = useState({});
  const [result, setResult] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({});
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/options`)
      .then((res) => setOptions(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (key, value) => {
    setDetails({ ...details, [key]: value });
  };

  const handleCustomerChange = (key, value) => {
    setCustomerInfo({ ...customerInfo, [key]: value });
  };

  const calculate = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);

      if (freightType === "Relocation") {
        const formData = new FormData();

        formData.append("from", details.from);
        formData.append("to", details.to);

        formData.append("name", customerInfo.name);
        formData.append("email", customerInfo.email);
        formData.append("phone", customerInfo.phone);

        if (details.images) {
          Array.from(details.images).forEach((image) => {
            formData.append("images", image);
          });
        }

        const res = await axios.post(
          `${API_BASE_URL}/api/relocation-enquiry`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setResult(res.data);
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/estimate`, {
          freightType,
          details,
          customerInfo,
        });

        setResult(res.data);
      }

      setShowCustomerPopup(false);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customerInfo.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!customerInfo.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(customerInfo.email)
    ) {
      newErrors.email = "Invalid email address";
    }

    if (!customerInfo.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s]{7,15}$/.test(customerInfo.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    if (freightType === "Relocation") {
      if (!details.from) {
        newErrors.from = "From location is required";
      }

      if (!details.to) {
        newErrors.to = "To location is required";
      }

      if (!details.images || details.images.length === 0) {
        newErrors.images = "Please upload at least one image";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validateFreightDetails = () => {
    const newErrors = {};

    switch (freightType) {
      case "Local":
        if (!details.from) newErrors.from = "From location is required";
        if (!details.to) newErrors.to = "To location is required";
        if (!details.vehicle) newErrors.vehicle = "Vehicle is required";
        break;

      case "Land":
        if (!details.from) newErrors.from = "From country is required";
        if (!details.to) newErrors.to = "To country is required";
        if (!details.vehicle) newErrors.vehicle = "Vehicle is required";
        break;

      case "Ocean_FCL":
        if (!details.from) newErrors.from = "From port is required";
        if (!details.to) newErrors.to = "To port is required";
        if (!details.containerType)
          newErrors.containerType = "Container type is required";
        if (!details.containerSize)
          newErrors.containerSize = "Container size is required";
        break;

      case "Air":
      case "Ocean_LCL":
        if (!details.from) newErrors.from = "From is required";
        if (!details.to) newErrors.to = "To is required";
        if (!details.weight) newErrors.weight = "Weight is required";
        if (!details.length) newErrors.length = "Length is required";
        if (!details.width) newErrors.width = "Width is required";
        if (!details.height) newErrors.height = "Height is required";
        break;

      case "Relocation":
        if (!details.from) newErrors.from = "From location is required";
        if (!details.to) newErrors.to = "To location is required";
        if (!details.images || details.images.length === 0)
          newErrors.images = "Please upload at least one image";
        break;

      default:
        break;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-[#0B1F3A] mb-8 text-center">
          QBH Estimate Calculator
        </h1>

        {/* Freight Type */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">
            Freight Type
          </label>

          <select
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              setFreightType(e.target.value);
              setDetails({});
              setResult(null);
            }}
          >
            <option value="Local">Domestic Transport Solutions</option>

            <option value="Land">GCC & International Road Freight</option>

            <option value="Ocean_FCL">
              Ocean Freight – Full Container Load (FCL)
            </option>

            <option value="Ocean_LCL">
              Ocean Freight – Less than Container Load (LCL)
            </option>

            <option value="Air">Air Cargo & Express Logistics</option>

            <option value="Relocation">
              Packing, Moving & Relocation Services
            </option>
          </select>
        </div>

        {/* LOCAL */}
        {freightType === "Local" && options && (
          <div className="grid md:grid-cols-3 gap-4">
            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From Location</option>
              {options.local_locations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To Location</option>
              {options.local_locations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("vehicle", e.target.value)}
            >
              <option>Vehicle</option>
              {options.local_vehicles.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        )}

        {/* LAND */}
        {freightType === "Land" && options && (
          <div className="grid md:grid-cols-3 gap-4">
            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From Country</option>
              {options.land_countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To Country</option>
              {options.land_countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("vehicle", e.target.value)}
            >
              <option>Vehicle</option>
              {options.local_vehicles.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        )}

        {/* OCEAN FCL */}
        {freightType === "Ocean_FCL" && options && (
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From Port</option>
              {options.ports.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To Port</option>
              {options.ports.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("containerType", e.target.value)}
            >
              <option>Container Type</option>
              {options.container_types.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("containerSize", e.target.value)}
            >
              <option>Container Size</option>
              {options.container_sizes.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        )}

        {/* AIR + LCL */}
        {(freightType === "Ocean_LCL" || freightType === "Air") && options && (
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From</option>

              {(freightType === "Air"
                ? options.air_locations
                : options.ports
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To</option>

              {(freightType === "Air"
                ? options.air_locations
                : options.ports
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Weight KG"
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("weight", e.target.value)}
            />

            <input
              type="number"
              placeholder="Length CM"
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("length", e.target.value)}
            />

            <input
              type="number"
              placeholder="Width CM"
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("width", e.target.value)}
            />

            <input
              type="number"
              placeholder="Height CM"
              className="border border-[#D9E1EC] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1E4FA3]"
              onChange={(e) => handleChange("height", e.target.value)}
            />
          </div>
        )}

        {/* RELOCATION */}
        {freightType === "Relocation" && options && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <select
                className={`w-full border rounded-lg px-4 py-3 ${
                  errors.from ? "border-red-500" : "border-[#D9E1EC]"
                }`}
                onChange={(e) => handleChange("from", e.target.value)}
              >
                <option value="">From Location</option>

                {options.local_locations.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>

              {errors.from && (
                <p className="text-red-500 text-sm mt-1">{errors.from}</p>
              )}
            </div>

            <div>
              <select
                className={`w-full border rounded-lg px-4 py-3 ${
                  errors.to ? "border-red-500" : "border-[#D9E1EC]"
                }`}
                onChange={(e) => handleChange("to", e.target.value)}
              >
                <option value="">To Location</option>

                {options.local_locations.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>

              {errors.to && (
                <p className="text-red-500 text-sm mt-1">{errors.to}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <input
                type="file"
                multiple
                accept="image/*"
                className={`w-full border rounded-lg px-4 py-3 ${
                  errors.images ? "border-red-500" : "border-[#D9E1EC]"
                }`}
                onChange={(e) => handleChange("images", e.target.files)}
              />

              {errors.images && (
                <p className="text-red-500 text-sm mt-1">{errors.images}</p>
              )}
            </div>
          </div>
        )}

        {/* BUTTON */}
        <div className="mt-8">
          <button
            onClick={() => {
              if (!validateFreightDetails()) return;
              setShowCustomerPopup(true);
            }}
            className="w-full bg-[#E87506] hover:bg-[#163d7d] text-white py-3 rounded-xl font-semibold transition"
          >
            Get Estimate
          </button>
        </div>

        {/* CUSTOMER POPUP */}
        {showCustomerPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold text-[#0B1F3A] mb-6">
                Enter Your Details
              </h3>

              <div className="space-y-4">
                {/* NAME */}
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
                      errors.name
                        ? "border-red-500 focus:ring-red-400"
                        : "border-[#D9E1EC] focus:ring-[#1E4FA3]"
                    }`}
                    onChange={(e) =>
                      handleCustomerChange("name", e.target.value)
                    }
                  />

                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-500 focus:ring-red-400"
                        : "border-[#D9E1EC] focus:ring-[#1E4FA3]"
                    }`}
                    onChange={(e) =>
                      handleCustomerChange("email", e.target.value)
                    }
                  />

                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* PHONE */}
                <div>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? "border-red-500 focus:ring-red-400"
                        : "border-[#D9E1EC] focus:ring-[#1E4FA3]"
                    }`}
                    onChange={(e) =>
                      handleCustomerChange("phone", e.target.value)
                    }
                  />

                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={calculate}
                  disabled={loading}
                  className="flex-1 bg-[#1E4FA3] hover:bg-[#163d7d] text-white py-3 rounded-xl font-semibold transition"
                >
                  {loading ? "Submitting..." : "Submit"}{" "}
                </button>

                <button
                  onClick={() => setShowCustomerPopup(false)}
                  className="flex-1 border border-[#D9E1EC] py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-8 bg-white border border-[#D9E1EC] rounded-2xl p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-[#D4A017] mb-3">
              {result.estimate === "Quote Pending"
                ? "Quote Pending"
                : `Estimate: ${result.estimate} ${result.currency}`}
            </h3>

            {freightType === "Relocation" && (
              <p className="text-gray-600">
                Our operations team will connect with you shortly regarding your
                relocation enquiry.
              </p>
            )}
            <p className="text-gray-600">{result.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
