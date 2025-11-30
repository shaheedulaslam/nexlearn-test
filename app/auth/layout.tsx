/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Image from "next/image";
import Loginlogo from "../../public/loginanime.svg";

function Layout({ children }: { children: React.JSX.Element }) {
  return (
    <div className="w-screen h-screen bg-[#1c3241]">
      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Left Side - Logo Section */}
        <div className="hidden lg:flex flex-col justify-between items-center p-4 lg:p-6 xl:p-8 relative overflow-hidden bg-[#1c3241]">
          {/* Header with Logo */}
          <div className="w-full flex justify-center mt-4 lg:mt-6 xl:mt-8">
            <div className="flex items-center justify-center gap-3 xl:gap-4">
              {/* SVG Logo */}
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16">
                <img
                  src="/hat.svg"
                  alt="NexLearn Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Title & subtitle */}
              <div className="text-white leading-tight">
                <h1 className="text-xl lg:text-2xl xl:text-4xl font-extrabold tracking-tight">
                  NexLearn
                </h1>
                <p className="text-xs lg:text-sm xl:text-base text-left opacity-80 mt-1">
                  futuristic learning
                </p>
              </div>
            </div>
          </div>

          {/* Centered Illustration */}
          <div className="flex-1 flex items-center justify-center w-full px-2 lg:px-4 xl:px-8">
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl flex justify-center">
              <Image
                alt="login illustration"
                src={Loginlogo}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Bottom spacing for balance */}
          <div className="h-4 lg:h-6 xl:h-8"></div>
        </div>

        {/* Mobile Header - Only shown on small screens */}
        <div className="lg:hidden bg-[#1c3241] p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10">
              <img
                src="/hat.svg"
                alt="NexLearn Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="text-white leading-tight">
              <h1 className="text-xl font-extrabold tracking-tight">NexLearn</h1>
              <p className="text-xs text-left opacity-80 mt-0.5">futuristic learning</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="bg-white rounded-t-2xl lg:rounded-l-2xl lg:rounded-r-none shadow-lg lg:shadow-none overflow-y-auto min-h-[calc(100vh-80px)] lg:min-h-full">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
            <div className="w-full max-w-md mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;