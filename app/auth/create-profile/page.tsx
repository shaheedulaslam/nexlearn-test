/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { apiService } from "@/app/lib/api";
import { RootState } from "@/app/lib/store";
import { validateEmail } from "@/app/lib/utils";
import {
  setCredentials,
  setError,
  setLoading,
} from "@/app/lib/slices/authSlices";

interface FormData {
  name: string;
  email: string;
  qualification: string;
  profile_image: File | null;
}

interface FormErrors {
  name?: string;
  email?: string;
  qualification?: string;
  profile_image?: string;
}

export default function CreateProfilePage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    qualification: "",
    profile_image: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [focusedFields, setFocusedFields] = useState({
    name: false,
    email: false,
    qualification: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Get mobile number from localStorage or redirect back
    const mobile =
      typeof window !== "undefined" ? localStorage.getItem("tempMobile") : null;
    if (!mobile) {
      router.push("/auth/login");
    }
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.qualification.trim()) {
      newErrors.qualification = "Qualification is required";
    }

    if (!formData.profile_image) {
      newErrors.profile_image = "Profile image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFocus = (field: string) => {
    setFocusedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validate file type - ONLY JPEG and PNG as per API requirement
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          profile_image: "Please select a valid image file (JPEG or PNG only)",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profile_image: "Image size should be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, profile_image: file }));
      setErrors((prev) => ({ ...prev, profile_image: undefined }));

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profile_image: null }));
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const mobile =
        typeof window !== "undefined"
          ? localStorage.getItem("tempMobile")
          : null;

      if (!mobile) {
        throw new Error("Mobile number not found. Please login again.");
      }

      const submitData = new FormData();
      submitData.append("mobile", `+91${mobile}`);
      submitData.append("name", formData.name.trim());
      submitData.append("email", formData.email.trim());
      submitData.append("qualification", formData.qualification.trim());

      if (formData.profile_image) {
        submitData.append("profile_image", formData.profile_image);
      }

      const response = await apiService.createProfile(submitData);

      if (response.success) {
        // Store tokens in both localStorage and cookies
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", response.access_token);
          localStorage.setItem("refreshToken", response.refresh_token);
          localStorage.removeItem("tempMobile");

          // Also set cookies for middleware
          document.cookie = `accessToken=${response.access_token}; path=/; max-age=86400`;
          document.cookie = `refreshToken=${response.refresh_token}; path=/; max-age=604800`;
        }

        dispatch(
          setCredentials({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
          })
        );

        // Add small delay and force redirect
        setTimeout(() => {
          router.replace("/");
        }, 100);
      } else {
        dispatch(setError(response.message || "Failed to create profile"));
      }
    } catch (err: any) {
      console.error("Profile creation error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create profile. Please try again.";
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const qualifications = [
    "High School",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Other",
  ];

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8">
      {/* Header with responsive spacing */}
      <div className="text-left mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
          Add Your Details
        </h2>
      </div>

      {/* Form with responsive spacing */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Profile Image Upload */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 31 31"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="sm:w-6 sm:h-6 lg:w-8 lg:h-8"
                >
                  <path
                    d="M19.9879 16.1806C19.9879 16.433 19.8876 16.6751 19.7091 16.8536C19.5306 17.0321 19.2885 17.1324 19.0361 17.1324H16.1807V19.9878C16.1807 20.2402 16.0804 20.4823 15.9019 20.6608C15.7234 20.8393 15.4813 20.9396 15.2289 20.9396C14.9765 20.9396 14.7344 20.8393 14.5559 20.6608C14.3774 20.4823 14.2771 20.2402 14.2771 19.9878V17.1324H11.4217C11.1693 17.1324 10.9272 17.0321 10.7487 16.8536C10.5702 16.6751 10.4699 16.433 10.4699 16.1806C10.4699 15.9281 10.5702 15.686 10.7487 15.5075C10.9272 15.329 11.1693 15.2288 11.4217 15.2288H14.2771V12.3734C14.2771 12.1209 14.3774 11.8788 14.5559 11.7003C14.7344 11.5218 14.9765 11.4215 15.2289 11.4215C15.4813 11.4215 15.7234 11.5218 15.9019 11.7003C16.0804 11.8788 16.1807 12.1209 16.1807 12.3734V15.2288H19.0361C19.2885 15.2288 19.5306 15.329 19.7091 15.5075C19.8876 15.686 19.9879 15.9281 19.9879 16.1806ZM27.6023 9.51794V22.8432C27.6023 23.6005 27.3015 24.3268 26.766 24.8623C26.2305 25.3977 25.5042 25.6986 24.7469 25.6986H5.71088C4.95357 25.6986 4.22729 25.3977 3.6918 24.8623C3.15631 24.3268 2.85547 23.6005 2.85547 22.8432V9.51794C2.85547 8.76064 3.15631 8.03436 3.6918 7.49887C4.22729 6.96337 4.95357 6.66254 5.71088 6.66254H9.00887L10.3509 4.65423C10.5244 4.39413 10.7594 4.18079 11.0349 4.03304C11.3105 3.8853 11.6182 3.80771 11.9309 3.80713H18.5269C18.8396 3.80771 19.1473 3.8853 19.4229 4.03304C19.6984 4.18079 19.9334 4.39413 20.1069 4.65423L21.4489 6.66254H24.7469C25.5042 6.66254 26.2305 6.96337 26.766 7.49887C27.3015 8.03436 27.6023 8.76064 27.6023 9.51794ZM25.6987 9.51794C25.6987 9.26551 25.5984 9.02341 25.4199 8.84492C25.2415 8.66642 24.9994 8.56614 24.7469 8.56614H20.9397C20.783 8.56624 20.6286 8.52763 20.4904 8.45375C20.3522 8.37986 20.2343 8.27297 20.1473 8.14259L18.5269 5.71073H11.9309L10.3105 8.14259C10.2235 8.27297 10.1056 8.37986 9.96739 8.45375C9.82916 8.52763 9.67482 8.56624 9.51809 8.56614H5.71088C5.45844 8.56614 5.21635 8.66642 5.03785 8.84492C4.85935 9.02341 4.75907 9.26551 4.75907 9.51794V22.8432C4.75907 23.0956 4.85935 23.3377 5.03785 23.5162C5.21635 23.6947 5.45844 23.795 5.71088 23.795H24.7469C24.9994 23.795 25.2415 23.6947 25.4199 23.5162C25.5984 23.3377 25.6987 23.0956 25.6987 22.8432V9.51794Z"
                    fill="#343330"
                  />
                </svg>
              )}
            </div>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="mt-3 sm:mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="profile_image"
            />
            <label
              htmlFor="profile_image"
              className="cursor-pointer bg-white py-2 px-3 sm:px-4 border border-gray-300 rounded-lg shadow-sm text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#14232A] transition-colors"
            >
              Choose Photo
            </label>
            <p className="text-xs text-gray-500 mt-1 sm:mt-2">
              JPEG, PNG only (Max 5MB)
            </p>
            {errors.profile_image && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1 sm:gap-2">
                <span className="text-xs">⚠️</span>
                {errors.profile_image}
              </p>
            )}
          </div>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <div className="relative">
            <label
              className={`absolute left-3 transition-all duration-200 pointer-events-none px-2 bg-white ${
                focusedFields.name || formData.name
                  ? '-top-2.5 text-xs sm:text-sm text-[#14232A] font-medium z-10'
                  : 'top-3 sm:top-4 text-base sm:text-lg text-gray-500 z-0'
              } ${errors.name ? "text-red-600" : ""}`}
            >
              Full Name {focusedFields.name && <span>*</span>}
            </label>

            <div
              className={`border-2 rounded-lg px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 transition-all duration-200 ${
                errors.name
                  ? "border-red-400 bg-red-50"
                  : focusedFields.name
                  ? "border-[#14232A] bg-white shadow-sm"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onFocus={() => handleFocus("name")}
                onBlur={() => handleBlur("name")}
                className="w-full outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base bg-transparent"
                placeholder=""
                disabled={loading}
              />
            </div>
          </div>
          {errors.name && (
            <p className="text-xs sm:text-sm text-red-600 font-medium mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
              <span className="text-xs">⚠️</span>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <div className="relative">
            <label
              className={`absolute left-3 transition-all duration-200 pointer-events-none px-2 bg-white ${
                focusedFields.email || formData.email
                  ? '-top-2.5 text-xs sm:text-sm text-[#14232A] font-medium z-10'
                  : 'top-3 sm:top-4 text-base sm:text-lg text-gray-500 z-0'
              } ${errors.email ? "text-red-600" : ""}`}
            >
              Email Address {focusedFields.email && <span>*</span>}
            </label>

            <div
              className={`border-2 rounded-lg px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 transition-all duration-200 ${
                errors.email
                  ? "border-red-400 bg-red-50"
                  : focusedFields.email
                  ? "border-[#14232A] bg-white shadow-sm"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
                className="w-full outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base bg-transparent"
                placeholder=""
                disabled={loading}
              />
            </div>
          </div>
          {errors.email && (
            <p className="text-xs sm:text-sm text-red-600 font-medium mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
              <span className="text-xs">⚠️</span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Qualification Field */}
        <div className="space-y-2">
          <div className="relative">
            <label
              className={`absolute left-3 transition-all duration-200 pointer-events-none px-2 bg-white ${
                focusedFields.qualification || formData.qualification
                  ? '-top-2.5 text-xs sm:text-sm text-[#14232A] font-medium z-10'
                  : 'top-3 sm:top-4 text-base sm:text-lg text-gray-500 z-0'
              } ${errors.qualification ? "text-red-600" : ""}`}
            >
              Highest Qualification{" "}
              {focusedFields.qualification && <span>*</span>}
            </label>

            <div
              className={`border-2 rounded-lg px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 transition-all duration-200 ${
                errors.qualification
                  ? "border-red-400 bg-red-50"
                  : focusedFields.qualification
                  ? "border-[#14232A] bg-white shadow-sm"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <select
                id="qualification"
                name="qualification"
                required
                value={formData.qualification}
                onChange={(e) =>
                  handleInputChange("qualification", e.target.value)
                }
                onFocus={() => handleFocus("qualification")}
                onBlur={() => handleBlur("qualification")}
                className="w-full outline-none text-gray-900 bg-transparent appearance-none text-sm sm:text-base"
                disabled={loading}
              >
                <option value=""></option>
                {qualifications.map((qual) => (
                  <option key={qual} value={qual}>
                    {qual}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.qualification && (
            <p className="text-xs sm:text-sm text-red-600 font-medium mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
              <span className="text-xs">⚠️</span>
              {errors.qualification}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2">
              <span className="text-xs">❌</span>
              {error}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#14232A] text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-[#1c3241] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent inline-block" />
                <span className="text-sm sm:text-base">Creating Profile...</span>
              </div>
            ) : (
              "Get Started"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}