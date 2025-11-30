/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useDispatch } from "react-redux";
import { logout } from "@/app/lib/slices/authSlices";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");

    // Clear cookies
    document.cookie =
      "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Force redirect to login
    router.push("/auth/login");
    router.refresh(); // Refresh the router to ensure clean state
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }


  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 h-14 sm:h-16 lg:h-20 
      flex items-center justify-between relative">

    {/* Invisible placeholder on large screens */}
    <div className="hidden lg:block lg:flex-1"></div>

    {/* Center Logo */}
    <div className="flex items-center justify-start lg:justify-center gap-2 sm:gap-3 lg:gap-4 lg:flex-1">
      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 shrink-0">
        <img
          src="/hat1.svg"
          alt="NexLearn Logo"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="leading-tight">
        <h1
          className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(90deg, #0A93BA 0%, #0B3A4B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          NexLearn
        </h1>
        <p
          className="text-xs text-left opacity-80 xs:block"
          style={{
            background: "linear-gradient(90deg, #0A93BA 0%, #0B3A4B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          futuristic learning
        </p>
      </div>
    </div>

    {/* Logout Button */}
    <div className="lg:flex-1 lg:flex lg:justify-end">
      <button
        onClick={handleLogout}
        className="bg-[#117A8B] text-white px-3 py-1.5 sm:px-4 sm:py-2 lg:px-4 lg:py-2 
          rounded-md shadow-sm hover:bg-[#0f6b79] transition text-xs sm:text-sm lg:text-base font-medium"
      >
        Logout
      </button>
    </div>
  </div>
</header>

  );
}