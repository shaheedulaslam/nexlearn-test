/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '@/app/lib/api';
import { RootState } from '@/app/lib/store';
import { validateMobile } from '@/app/lib/utils';
import { setError, setLoading } from '@/app/lib/slices/authSlices';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(setError(null));
  }, [dispatch]);

  useEffect(() => {
    // Check if already authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('Already authenticated, redirecting to exam');
        router.replace('/');
      }
    }
  }, [router]);

  const validateForm = (): boolean => {
    if (!mobile.trim()) {
      setMobileError('Mobile number is required');
      return false;
    }
    
    if (!validateMobile(mobile)) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return false;
    }
    
    setMobileError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await apiService.sendOtp(mobile);
      if (response.success) {
        router.push(`/auth/verify-otp?mobile=${encodeURIComponent(mobile)}`);
      } else {
        dispatch(setError(response.message || 'Failed to send OTP'));
      }
    } catch (err: any) {
      dispatch(setError(err.response?.data?.message || 'Failed to send OTP. Please try again.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleMobileChange = (value: string) => {
    // Allow only numbers and limit to 10 digits
    const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
    setMobile(numbersOnly);
    
    // Clear error when user starts typing
    if (mobileError) {
      setMobileError('');
    }
  };

  // Show country code only when user starts typing or has input
  const showCountryCode = isFocused || mobile.length > 0;

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8">
      {/* Header with responsive spacing */}
      <div className="text-left mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
          Enter your phone number
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
          We use your mobile number to identify your account
        </p>
      </div>

      {/* Form with responsive spacing */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Phone Input Section */}
        <div className="space-y-2">
          <div className="relative">
            {/* Floating Label */}
            <label className={`absolute left-3 transition-all duration-200 pointer-events-none px-2 bg-white ${
              isFocused || mobile 
                ? '-top-2.5 text-xs sm:text-sm text-[#14232A] font-medium z-10' 
                : 'top-3 sm:top-4 text-base sm:text-lg text-gray-500 z-0'
            } ${mobileError ? 'text-red-600' : ''}`}>
              Phone number
            </label>
            
            {/* Input Container */}
            <div className={`flex items-center border-2 rounded-lg px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 transition-all duration-200 ${
              mobileError 
                ? 'border-red-400 bg-red-50' 
                : isFocused
                  ? 'border-[#14232A] bg-white shadow-sm'
                  : 'border-gray-300 bg-white hover:border-gray-400'
            }`}>
              {/* Country Code */}
              {showCountryCode && (
                <div className="flex items-center pr-3 sm:pr-4 mr-3 sm:mr-4 border-r border-gray-300 transition-all duration-200">
                  <span className="text-lg sm:text-xl mr-2 sm:mr-3">🇮🇳</span>
                  <span className="text-sm sm:text-base font-medium text-gray-700">+91</span>
                </div>
              )}

              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isFocused ? "Enter 10-digit number" : ""}
                className="w-full outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base bg-transparent pt-0.5 sm:pt-1"
                disabled={loading}
              />
            </div>
          </div>

          {mobileError && (
            <p className="text-xs sm:text-sm text-red-600 font-medium mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
              <span className="text-xs">⚠️</span>
              {mobileError}
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

        {/* Terms Text */}
        <div className="pt-2 sm:pt-4">
          <p className="text-xs sm:text-sm text-gray-600 text-center leading-5 sm:leading-6">
            By tapping <span className="font-semibold text-gray-900">Get started</span>, you agree to our{' '}
            <span className="text-[#14232A] underline font-medium cursor-pointer hover:text-[#1c3241]">
              Terms & Conditions
            </span>
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={loading || mobile.length !== 10}
            className="w-full bg-[#14232A] text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-[#1c3241] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent inline-block" />
                <span className="text-sm sm:text-base">Sending OTP...</span>
              </div>
            ) : (
              'Get Started'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}