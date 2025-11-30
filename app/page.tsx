/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { apiService } from "@/app/lib/api";
import {
  setExamInfo,
  setQuestions,
  setLoading,
  setError,
} from "@/app/lib/slices/examSlice";
import { RootState } from "@/app/lib/store";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import Navbar from "@/app/components/ui/Navbar";

interface ExamInfo {
  questions_count: number;
  total_marks: number;
  total_time: number;
  time_for_each_question: number;
  mark_per_each_answer: number;
  instruction: string;
  questions?: any[];
}

export default function InstructionsPage() {
  const [examInfo, setExamInfoState] = useState<ExamInfo | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.exam);
  const { isAuthenticated } = useAuthCheck(true);

  // Set client-side flag to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchExamInfo = async () => {
      dispatch(setLoading(true));
      try {
        const response = await apiService.getQuestions();
        if (response.success) {
          setExamInfoState(response);

          dispatch(
            setExamInfo({
              questions_count: response.questions_count,
              total_marks: response.total_marks,
              total_time: response.total_time,
              time_for_each_question: response.time_for_each_question,
              mark_per_each_answer: response.mark_per_each_answer,
              instruction: response.instruction,
            })
          );

          if (response.questions && Array.isArray(response.questions)) {
            dispatch(setQuestions(response.questions));
          }
        } else {
          dispatch(setError("Failed to load exam instructions"));
        }
      } catch (err: any) {
        dispatch(
          setError(err.response?.data?.message || "Failed to load exam")
        );
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (isAuthenticated) {
      fetchExamInfo();
    }
  }, [dispatch, isAuthenticated]);

  const handleStartExam = () => {
    router.push("/exam/questions");
  };

  // Show loading state until we're sure about authentication status
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading exam instructions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd] p-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Exam
          </h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (val: number | string) => {
    if (typeof val === "number") {
      const minutes = Math.floor(val);
      const seconds = 0;
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return String(val);
  };

  return (
    <div className="min-h-screen bg-[#f3fbfd]">
      <Navbar />
      {/* Main content */}
      <main className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl text-center font-semibold text-slate-800 mb-4 sm:mb-6">
            {examInfo?.questions_count
              ? `${
                  examInfo?.questions_count > 0
                    ? "Ancient Indian History MCQ"
                    : "Exam"
                }`
              : "Exam"}
          </h2>

          {/* Stats card: responsive layout */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-[#14232A] text-white rounded-xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-2xl shadow-md">
              {/* Mobile: Vertical layout */}
              <div className="sm:hidden space-y-6">
                {/* Total MCQ's */}
                <div className="text-center space-y-2">
                  <div className="text-sm opacity-80">Total MCQ's</div>
                  <div className="text-3xl font-medium">
                    {examInfo?.questions_count ?? "--"}
                  </div>
                </div>

                {/* Horizontal divider */}
                <div className="border-t border-white/30 mx-4"></div>

                {/* Total marks */}
                <div className="text-center space-y-2">
                  <div className="text-sm opacity-80">Total marks</div>
                  <div className="text-3xl font-medium">
                    {examInfo?.total_marks ?? "--"}
                  </div>
                </div>

                {/* Horizontal divider */}
                <div className="border-t border-white/30 mx-4"></div>

                {/* Total time */}
                <div className="text-center space-y-2">
                  <div className="text-sm opacity-80">Total time</div>
                  <div className="text-3xl font-medium">
                    {examInfo ? formatTime(examInfo.total_time) : "--:--"}
                  </div>
                </div>
              </div>

              {/* Desktop: Horizontal layout */}
              <div className="hidden sm:flex gap-4 lg:gap-6 items-center justify-between text-center">
                {/* Total MCQ's */}
                <div className="flex-1 space-y-2">
                  <div className="text-sm lg:text-base opacity-80">Total MCQ's</div>
                  <div className="text-3xl lg:text-4xl font-medium mt-1 lg:mt-2">
                    {examInfo?.questions_count ?? "--"}
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="flex justify-center">
                  <div className="border-l border-white h-16 lg:h-20"></div>
                </div>

                {/* Total marks */}
                <div className="flex-1 space-y-2">
                  <div className="text-sm lg:text-base opacity-80">Total marks</div>
                  <div className="text-3xl lg:text-4xl font-medium mt-1 lg:mt-2">
                    {examInfo?.total_marks ?? "--"}
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="flex justify-center">
                  <div className="border-l border-white h-16 lg:h-20"></div>
                </div>

                {/* Total time */}
                <div className="flex-1 space-y-2">
                  <div className="text-sm lg:text-base opacity-80">Total time</div>
                  <div className="text-3xl lg:text-4xl font-medium mt-1 lg:mt-2">
                    {examInfo ? formatTime(examInfo.total_time) : "--:--"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions content */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-3 sm:mb-4">
              Instructions:
            </h3>

            <div className="rounded-lg p-3 sm:p-4">
              {examInfo?.instruction ? (
                <div className="space-y-2 sm:space-y-3 text-sm text-slate-600 leading-6 sm:leading-7">
                  <div
                    className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base"
                    dangerouslySetInnerHTML={{
                      __html: examInfo.instruction
                        .replace(
                          /<ol>/g,
                          '<ol class="list-decimal list-outside pl-4 sm:pl-5 space-y-2 sm:space-y-3">'
                        )
                        .replace(/<li>/g, '<li class="pl-1 sm:pl-2">'),
                    }}
                  />
                </div>
              ) : (
                <ol className="list-decimal list-outside space-y-2 sm:space-y-3 text-sm text-slate-600 leading-6 sm:leading-7 pl-4 sm:pl-5">
                  <li className="pl-1 sm:pl-2">
                    You have {examInfo?.total_time ?? "the allotted"} minutes to
                    complete the test.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    Test consists of {examInfo?.questions_count ?? "--"}{" "}
                    multiple-choice questions.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    You are allowed 2 retest attempts if you do not pass on the
                    first try.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    Each incorrect answer will incur a negative mark of -1/4.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    Ensure you are in a quiet environment and have a stable
                    internet connection.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    Keep an eye on the timer, and try to answer all questions
                    within the given time.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    Do not use any external resources such as dictionaries,
                    websites, or assistance.
                  </li>
                  <li className="pl-1 sm:pl-2">
                    Complete the test honestly to accurately assess your
                    proficiency level.
                  </li>
                  <li className="pl-1 sm:pl-2">Check answers before submitting.</li>
                  <li className="pl-1 sm:pl-2">
                    Your test results will be displayed immediately after
                    submission.
                  </li>
                </ol>
              )}
            </div>

            {/* Start Test CTA */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <button
                onClick={handleStartExam}
                className="bg-[#14232A] hover:bg-[#1c3241] text-white font-semibold py-3 px-6 sm:px-8 rounded-lg w-full sm:w-56 text-center shadow-md transition transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}