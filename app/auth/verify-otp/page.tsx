/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { apiService } from "@/app/lib/api";
import {
  setCredentials,
  setError,
  setLoading,
} from "@/app/lib/slices/authSlices";
import { useSelector } from "react-redux";
import { RootState } from "@/app/lib/store";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [mobile, setMobile] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const mobileParam = searchParams.get("mobile");
    if (mobileParam) {
      setMobile(mobileParam);
    } else {
      router.push("/auth/login");
    }
  }, [searchParams, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== "") && index === 5) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("").slice(0, 6);
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);

      // Focus the last input
      const lastFilledIndex = newOtp.length - 1;
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleSubmit = async (enteredOtp?: string) => {
    const otpValue = enteredOtp || otp.join("");

    if (otpValue.length !== 6) {
      dispatch(setError("Please enter all 6 digits of OTP"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await apiService.verifyOtp(mobile, otpValue);

      if (response.success) {
        if (response.login) {
          // User exists - store tokens in both localStorage and cookies
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", response.access_token);
            localStorage.setItem("refreshToken", response.refresh_token);

            // Also set cookies for middleware
            document.cookie = `accessToken=${response.access_token}; path=/; max-age=86400`; // 24 hours
            document.cookie = `refreshToken=${response.refresh_token}; path=/; max-age=604800`; // 7 days
          }

          dispatch(
            setCredentials({
              user: response.user,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
            })
          );

          // Add a small delay to ensure state is updated
          setTimeout(() => {
            router.push("/");
          }, 100);
        } else {
          // New user - redirect to profile creation
          if (typeof window !== "undefined") {
            localStorage.setItem("tempMobile", mobile);
          }
          router.push("/auth/create-profile");
        }
      } else {
        dispatch(setError(response.message || "Invalid OTP"));
      }
    } catch (err: any) {
      dispatch(
        setError(
          err.response?.data?.message ||
            "Failed to verify OTP. Please try again."
        )
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await apiService.sendOtp(mobile);
      if (response.success) {
        setResendTimer(30);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        dispatch(setError(response.message || "Failed to resend OTP"));
      }
    } catch (err: any) {
      dispatch(
        setError(
          err.response?.data?.message ||
            "Failed to resend OTP. Please try again."
        )
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const { loading, error } = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8">
      {/* Header with responsive spacing */}
      <div className="text-left mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
          Enter the code we texted you
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
          We've sent an SMS to +91 {mobile}
        </p>
      </div>

      {/* Form with responsive spacing */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6 sm:space-y-8"
      >
        {/* OTP Input Section */}
        <div className="space-y-2">
          <div className="relative">
            {/* Floating Label */}
            <label
              className={`absolute left-3 transition-all duration-200 pointer-events-none px-2 bg-white ${
                isFocused || otp.some((digit) => digit !== "")
                  ? "-top-2.5 text-xs sm:text-sm text-[#14232A] font-medium z-10"
                  : "top-3 sm:top-4 text-base sm:text-lg text-gray-500 z-0"
              }`}
            >
              SMS Code
            </label>

            {/* OTP Input Container */}
            <div
              className={`flex justify-center space-x-2 sm:space-x-3 border-2 rounded-lg px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 transition-all duration-200 ${
                error
                  ? "border-red-400 bg-red-50"
                  : isFocused
                  ? "border-[#14232A] bg-white shadow-sm"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-8 h-6 sm:w-10 sm:h-7 lg:w-12 lg:h-8 text-center text-lg sm:text-xl lg:text-2xl font-semibold border-0 bg-transparent outline-none text-gray-900 focus:ring-0"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-600 font-medium mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
              <span className="text-xs">⚠️</span>
              {error}
            </p>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xs sm:text-sm text-gray-600 text-left leading-5 sm:leading-6">
            Your 6 digit code is on its way. This can sometimes take a few
            moments to arrive.
          </p>
        </div>

        {/* Resend OTP Section */}
        <div className="text-left pt-2">
          <p className="text-xs sm:text-sm text-gray-600">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend || loading}
              className="font-medium text-[#14232A] underline hover:text-[#1c3241] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
            </button>
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={loading || otp.some((digit) => digit === "")}
            className="w-full bg-[#14232A] text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-[#1c3241] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent inline-block" />
                <span className="text-sm sm:text-base">Verifying...</span>
              </div>
            ) : (
              "Verify OTP"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}