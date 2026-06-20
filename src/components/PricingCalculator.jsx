import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const QBH_ASSET_BASE_URL =
  import.meta.env.VITE_QBH_ASSET_BASE_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://qbh.qa");
const CONTROL_CLASS =
  "w-full border border-[#D9E1EC] rounded-lg px-4 py-3 text-[#002C3A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4660C] focus:border-[#E4660C]";
const ERROR_CONTROL_CLASS =
  "w-full border border-red-500 rounded-lg px-4 py-3 text-[#002C3A] focus:outline-none focus:ring-2 focus:ring-red-400";
const PRIMARY_BUTTON_CLASS =
  "rounded-lg bg-[#E4660C] py-3 font-semibold text-white transition hover:bg-[#C75408] disabled:cursor-not-allowed disabled:bg-gray-300";
const EMPTY_OPTIONS = {
  local_locations: [],
  local_vehicles: [],
  land_countries: [],
  ports: [],
  container_types: [],
  container_sizes: [],
  air_locations: [],
};

const normalizeOptions = (data) =>
  Object.fromEntries(
    Object.keys(EMPTY_OPTIONS).map((key) => [
      key,
      Array.isArray(data?.[key]) ? data[key] : EMPTY_OPTIONS[key],
    ]),
  );

function QbhInline({ variant = "gray800", className = "" }) {
  const imageName =
    variant === "white"
      ? "qbhQWhite.png"
      : variant === "secondary"
        ? "qbhQSecondary.png"
      : variant === "gray600"
        ? "qbhQgray600.png"
        : "qbhQgray800.png";

  return (
    <span className={`inline-flex items-baseline leading-none ${className}`}>
      <span className="sr-only">QBH</span>
      <img
        src={`${QBH_ASSET_BASE_URL}/qbhQpngs/${imageName}`}
        alt=""
        aria-hidden="true"
        className="h-[0.75em] w-auto shrink-0 select-none"
      />
      <span aria-hidden="true">BH</span>
    </span>
  );
}

export default function PricingCalculator() {
  const contentRef = useRef(null);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [freightType, setFreightType] = useState("Local");
  const [details, setDetails] = useState({});
  const [result, setResult] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({});
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [optionsError, setOptionsError] = useState(
    API_BASE_URL
      ? ""
      : "Calculator options are unavailable because VITE_API_URL is not configured.",
  );

  useEffect(() => {
    if (!API_BASE_URL) {
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/options`)
      .then((res) => {
        setOptions(normalizeOptions(res.data));
        setOptionsError("");
      })
      .catch((err) => {
        console.error(err);
        setOptionsError("Calculator options could not be loaded from the API.");
      });
  }, []);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || !window.parent) return undefined;

    const notifyParent = () => {
      window.parent.postMessage(
        {
          type: "QBH_ESTIMATE_RESIZE",
          height: Math.ceil(element.scrollHeight),
        },
        "*",
      );
    };

    notifyParent();

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(notifyParent);
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
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
    <div ref={contentRef} className="w-full bg-transparent px-1 py-2 md:px-2">
      <div className="w-full">
        <h1 className="mb-8 flex flex-col items-center justify-center gap-2 text-center font-bold leading-tight text-[#002C3A]">
          <QbhInline variant="secondary" className="text-4xl md:text-5xl" />
          <span className="whitespace-nowrap text-3xl md:text-4xl">
            Estimate Calculator
          </span>
        </h1>

        {/* Freight Type */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-[#002C3A]">
            Freight Type
          </label>

          <select
            className={CONTROL_CLASS}
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

        {optionsError && (
          <div className="mb-6 rounded-lg border border-[#E4660C]/25 bg-[#F1F1F1] px-4 py-3 text-sm font-medium text-[#8f3d07]">
            {optionsError}
          </div>
        )}

        {/* LOCAL */}
        {freightType === "Local" && (
          <div className="grid md:grid-cols-3 gap-4">
            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From Location</option>
              {options.local_locations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To Location</option>
              {options.local_locations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
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
        {freightType === "Land" && (
          <div className="grid md:grid-cols-3 gap-4">
            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From Country</option>
              {options.land_countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To Country</option>
              {options.land_countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
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
        {freightType === "Ocean_FCL" && (
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("from", e.target.value)}
            >
              <option>From Port</option>
              {options.ports.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("to", e.target.value)}
            >
              <option>To Port</option>
              {options.ports.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("containerType", e.target.value)}
            >
              <option>Container Type</option>
              {options.container_types.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              className={CONTROL_CLASS}
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
        {(freightType === "Ocean_LCL" || freightType === "Air") && (
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className={CONTROL_CLASS}
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
              className={CONTROL_CLASS}
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
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("weight", e.target.value)}
            />

            <input
              type="number"
              placeholder="Length CM"
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("length", e.target.value)}
            />

            <input
              type="number"
              placeholder="Width CM"
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("width", e.target.value)}
            />

            <input
              type="number"
              placeholder="Height CM"
              className={CONTROL_CLASS}
              onChange={(e) => handleChange("height", e.target.value)}
            />
          </div>
        )}

        {/* RELOCATION */}
        {freightType === "Relocation" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <select
                className={errors.from ? ERROR_CONTROL_CLASS : CONTROL_CLASS}
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
                className={errors.to ? ERROR_CONTROL_CLASS : CONTROL_CLASS}
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
                className={errors.images ? ERROR_CONTROL_CLASS : CONTROL_CLASS}
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
              if (optionsError) return;
              if (!validateFreightDetails()) return;
              setShowCustomerPopup(true);
            }}
            disabled={Boolean(optionsError)}
            className={`w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Get Estimate
          </button>
        </div>

        {/* CUSTOMER POPUP */}
        {showCustomerPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
              <h3 className="mb-6 text-2xl font-bold text-[#002C3A]">
                Enter Your Details
              </h3>

              <div className="space-y-4">
                {/* NAME */}
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={
                      errors.name ? ERROR_CONTROL_CLASS : CONTROL_CLASS
                    }
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
                    className={
                      errors.email ? ERROR_CONTROL_CLASS : CONTROL_CLASS
                    }
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
                    className={
                      errors.phone ? ERROR_CONTROL_CLASS : CONTROL_CLASS
                    }
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
                  className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}
                >
                  {loading ? "Submitting..." : "Submit"}{" "}
                </button>

                <button
                  onClick={() => setShowCustomerPopup(false)}
                  className="flex-1 rounded-lg border border-[#D9E1EC] py-3 font-semibold text-[#002C3A] transition hover:bg-[#F1F1F1]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-8 rounded-lg border border-[#D9E1EC] bg-[#F1F1F1] p-6">
            <h3 className="mb-3 text-2xl font-bold text-[#E4660C]">
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
