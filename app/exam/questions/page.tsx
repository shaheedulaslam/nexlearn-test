/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/lib/store";
import { apiService } from "@/app/lib/api";
import {
  setQuestions,
  setAnswer,
  setCurrentQuestion,
  nextQuestion,
  previousQuestion,
  startExam,
  decrementTime,
  submitExam,
  setLoading,
  setError,
  toggleMarkForReview,
} from "@/app/lib/slices/examSlice";
import QuestionCard from "@/app/components/exam/QuestionCard";
import Timer from "@/app/components/exam/Timer";
import Header from "@/app/components/ui/Navbar";

export default function QuestionsPage() {
  const [localLoading, setLocalLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const {
    questions,
    currentQuestion,
    answers,
    timeRemaining,
    examStarted,
    examInfo,
    loading: examLoading,
    error: examError,
    reviewQuestions,
  } = useSelector((state: RootState) => state.exam);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    const loadQuestions = async () => {
      try {
        dispatch(setLoading(true));
        const response = await apiService.getQuestions();
        if (response.success) {
          dispatch(setQuestions(response.questions || []));
          dispatch(startExam());
        } else {
          dispatch(setError("Failed to load questions"));
        }
      } catch (err: any) {
        dispatch(
          setError(err.response?.data?.message || "Failed to load questions")
        );
      } finally {
        dispatch(setLoading(false));
        setLocalLoading(false);
      }
    };

    if (questions.length === 0) {
      loadQuestions();
    } else {
      setLocalLoading(false);
    }
  }, [dispatch, router, isAuthenticated, questions.length]);

  // Timer effect (keeps Redux timer in sync)
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining, dispatch]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && examStarted && !submitting) {
      // hide modal if open and call submit
      setShowSubmitModal(false);
      doSubmit();
    }
  }, [timeRemaining, examStarted, submitting]);

  const handleAnswerSelect = (questionId: number, optionId: number | null) => {
    dispatch(
      setAnswer({
        question_id: questionId,
        selected_option_id: optionId,
        marked_for_review: false,
      })
    );
  };

  const handleMarkForReview = () => {
    if (currentQuestionData) {
      dispatch(toggleMarkForReview(currentQuestionData.id));
    }
  };

  const handleNext = () => {
    dispatch(nextQuestion());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    dispatch(previousQuestion());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuestionSelect = (questionIndex: number) => {
    dispatch(setCurrentQuestion(questionIndex));
    setShowPalette(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Actual submission routine (no confirm)
  const doSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const validAnswers = questions.map((question) => {
        const questionId = question.question_id || question.id;
        const existingAnswer = answers.find(
          (a) => a.question_id === questionId
        );
        return {
          question_id: questionId,
          selected_option_id: existingAnswer?.selected_option_id || null,
          marked_for_review: existingAnswer?.marked_for_review || false,
        };
      });

      const response = await apiService.submitAnswers(validAnswers);
      if (response.success) {
        dispatch(submitExam(response));
        router.push("/exam/results");
      } else {
        alert("Failed to submit exam: " + (response.message || "Server error"));
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(
        "Failed to submit exam: " +
          (err.response?.data?.message || "Network error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Called when user clicks the final "Submit" button => open modal
  const openSubmitModal = () => {
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
  };

  const currentQuestionData = questions[currentQuestion];
  const currentAnswer = currentQuestionData
    ? answers.find((a) => a.question_id === currentQuestionData.id)
    : null;

  const answeredCount = answers.filter(
    (a) => a.selected_option_id !== null
  ).length;

  const markedCount = answers.filter(
    (a) => a.marked_for_review === true
  ).length;

  function formatTime(seconds: number) {
    if (seconds <= 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0"
      )}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  useEffect(() => {
    console.log("Questions:", questions);
    console.log("Answers:", answers);
    console.log("Current question data:", currentQuestionData);
  }, [questions, answers, currentQuestionData]);

  if (localLoading || examLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (examError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
            Error Loading Questions
          </h3>
          <p className="text-gray-600 mb-4">{examError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3fbfd]">
        <div className="text-center">
          <p className="text-gray-600">No questions available.</p>
        </div>
      </div>
    );
  }

  const isCurrentMarked = currentAnswer?.marked_for_review || false;

  return (
    <div className="min-h-screen bg-[#f3fbfd]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main column */}
          <div className="lg:col-span-8">
            <div className="rounded-lg p-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-700">
                Ancient Indian History MCQ
              </h2>
              <div className="inline-flex items-center gap-4">
                <div className="bg-white rounded shadow px-3 py-1 text-sm text-gray-700">
                  {String(currentQuestion + 1).padStart(2, "0")}/
                  {String(questions.length).padStart(2, "0")}
                </div>
              </div>
            </div>

            <QuestionCard
              question={currentQuestionData}
              selectedAnswer={currentAnswer?.selected_option_id ?? null}
              onAnswerSelect={handleAnswerSelect}
              questionNumber={currentQuestion + 1}
              isMarkedForReview={isCurrentMarked}
            />

            {/* Buttons: responsive stacking on small screens */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
              <button
                onClick={handleMarkForReview}
                className={`w-full sm:w-1/3 font-semibold py-3 px-6 rounded shadow ${
                  isCurrentMarked
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-[#800080] hover:bg-[#6f007d] text-white"
                }`}
              >
                {isCurrentMarked ? "Unmark Review" : "Mark for Review"}
              </button>

              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="w-full sm:w-1/3 bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded disabled:opacity-50 hover:bg-gray-400 transition-colors"
              >
                Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={openSubmitModal}
                  disabled={submitting}
                  className="w-full sm:w-1/3 bg-green-800 hover:bg-green-900 text-white font-semibold py-3 px-8 rounded disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full sm:w-1/3 bg-[#14232A] hover:bg-[#0f2026] text-white font-semibold py-3 px-8 rounded transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-lg p-4 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Question No. Sheet:
                  </h3>
                  <div className="hidden md:flex items-center text-sm text-gray-600">
                    Remaining Time:&nbsp;
                    <div className="ml-2 inline-flex items-center px-3 py-1 rounded bg-[#1c3241] text-white">
                      <Timer
                        duration={timeRemaining}
                        onTimeUp={() => {
                          setShowSubmitModal(false);
                          doSubmit();
                        }}
                        compact
                      />
                    </div>
                  </div>
                </div>

                {/* make the grid horizontally scrollable on narrow screens to avoid squeezing */}
                <div className="overflow-x-auto -mx-2 px-2 py-1">
                  <div className="grid grid-cols-5 gap-2 min-w-[320px] sm:min-w-0 mt-1">
                    {questions.map((q, idx) => {
                      const questionId = q.question_id || q.id;
                      const ans = answers.find(
                        (a) => a.question_id === questionId
                      );
                      const isCurrent = idx === currentQuestion;
                      const isAnswered = !!(
                        ans && ans.selected_option_id !== null
                      );
                      const isMarked = ans?.marked_for_review || false;

                      let classes =
                        "w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium border transition-colors";

                      if (isMarked && isAnswered) {
                        classes += " bg-purple-700 text-white border-purple-700";
                      } else if (isMarked) {
                        classes += " bg-purple-700 text-white border-purple-700";
                      } else if (isAnswered) {
                        classes += " bg-green-500 text-white border-green-500";
                      } else {
                        classes +=
                          " bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
                      }

                      if (isCurrent) {
                        classes += " ring-2 ring-[#14232A]";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuestionSelect(idx)}
                          className={classes}
                          title={`Question ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded" /> Answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-white border border-gray-300 rounded" />{" "}
                    Not Answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-700 rounded" /> Marked
                    for Review
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 ring-2 ring-[#14232A] rounded" />{" "}
                    Current Question
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeSubmitModal}
          ></div>

          {/* modal card - responsive widths */}
          <div className="relative bg-white w-full max-w-sm sm:max-w-md md:max-w-lg rounded-xl shadow-2xl z-10">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Are you sure you want to submit the test?
                </h3>
                <button
                  onClick={closeSubmitModal}
                  className="text-gray-400 hover:text-gray-600 ml-3"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
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
              </div>
            </div>

            <div className="px-6 py-4">
              {/* rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 w-10 h-10 rounded-md flex items-center justify-center text-white">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.38093 2.30666C6.28607 2.30666 5.2158 2.63133 4.30545 3.2396C3.39511 3.84787 2.68558 4.71243 2.2666 5.72395C1.84761 6.73547 1.73799 7.84852 1.95158 8.92234C2.16518 9.99617 2.69241 10.9825 3.46659 11.7567C4.24077 12.5309 5.22714 13.0581 6.30097 13.2717C7.37479 13.4853 8.48784 13.3757 9.49936 12.9567C10.5109 12.5377 11.3754 11.8282 11.9837 10.9179C12.592 10.0075 12.9166 8.93724 12.9166 7.84238C12.915 6.37473 12.3312 4.96767 11.2934 3.92989C10.2556 2.89211 8.84858 2.30834 7.38093 2.30666ZM10.0139 5.86221L7.70731 8.16875C7.66445 8.21161 7.61357 8.24561 7.55757 8.26881C7.50157 8.292 7.44155 8.30394 7.38093 8.30394C7.32032 8.30394 7.2603 8.292 7.2043 8.26881C7.1483 8.24561 7.09742 8.21161 7.05455 8.16875C7.01169 8.12589 6.9777 8.07501 6.9545 8.01901C6.9313 7.96301 6.91937 7.90299 6.91937 7.84238C6.91937 7.78176 6.9313 7.72174 6.9545 7.66574C6.9777 7.60974 7.01169 7.55886 7.05455 7.516L9.3611 5.20945C9.40396 5.16659 9.45485 5.13259 9.51085 5.1094C9.56685 5.0862 9.62687 5.07426 9.68748 5.07426C9.74809 5.07426 9.80811 5.0862 9.86411 5.1094C9.92011 5.13259 9.971 5.16659 10.0139 5.20945C10.0567 5.25231 10.0907 5.3032 10.1139 5.3592C10.1371 5.4152 10.149 5.47522 10.149 5.53583C10.149 5.59644 10.1371 5.65646 10.1139 5.71246C10.0907 5.76846 10.0567 5.81935 10.0139 5.86221ZM5.53569 0.922735C5.53569 0.800388 5.5843 0.683052 5.67081 0.59654C5.75732 0.510028 5.87466 0.461426 5.997 0.461426H8.76486C8.88721 0.461426 9.00454 0.510028 9.09106 0.59654C9.17757 0.683052 9.22617 0.800388 9.22617 0.922735C9.22617 1.04508 9.17757 1.16242 9.09106 1.24893C9.00454 1.33544 8.88721 1.38404 8.76486 1.38404H5.997C5.87466 1.38404 5.75732 1.33544 5.67081 1.24893C5.5843 1.16242 5.53569 1.04508 5.53569 0.922735Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700">Remaining Time:</div>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {formatTime(timeRemaining)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-400 w-10 h-10 rounded-md flex items-center justify-center text-white">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.08571 7.67619C7.25302 7.67619 7.39817 7.61468 7.52119 7.49167C7.64421 7.36865 7.70571 7.22349 7.70571 7.05619C7.70571 6.88889 7.64421 6.74373 7.52119 6.62071C7.39817 6.4977 7.25302 6.43619 7.08571 6.43619C6.91841 6.43619 6.77325 6.4977 6.65024 6.62071C6.52722 6.74373 6.46571 6.88889 6.46571 7.05619C6.46571 7.22349 6.52722 7.36865 6.65024 7.49167C6.77325 7.61468 6.91841 7.67619 7.08571 7.67619ZM7.08571 5.78667C7.19397 5.78667 7.29484 5.7473 7.38833 5.66857C7.48183 5.58984 7.53841 5.48651 7.55809 5.35857C7.57778 5.24048 7.6196 5.13222 7.68357 5.03381C7.74754 4.9354 7.86317 4.80254 8.03048 4.63524C8.32571 4.34 8.52254 4.10135 8.62095 3.91929C8.71937 3.73722 8.76857 3.52317 8.76857 3.27714C8.76857 2.83429 8.61357 2.47262 8.30357 2.19214C7.99357 1.91167 7.58762 1.77143 7.08571 1.77143C6.76095 1.77143 6.46571 1.84524 6.2 1.99286C5.93429 2.14048 5.7227 2.35206 5.56524 2.62762C5.50619 2.72603 5.50127 2.82937 5.55048 2.93762C5.59968 3.04587 5.68333 3.1246 5.80143 3.17381C5.90968 3.22302 6.01548 3.22794 6.11881 3.18857C6.22214 3.14921 6.30825 3.08032 6.37714 2.9819C6.46571 2.85397 6.56905 2.75802 6.68714 2.69405C6.80524 2.63008 6.9381 2.5981 7.08571 2.5981C7.3219 2.5981 7.51381 2.66452 7.66143 2.79738C7.80905 2.93024 7.88286 3.10984 7.88286 3.33619C7.88286 3.47397 7.84349 3.60436 7.76476 3.72738C7.68603 3.8504 7.54825 4.0054 7.35143 4.19238C7.06603 4.43841 6.88397 4.62786 6.80524 4.76071C6.72651 4.89357 6.6773 5.08794 6.65762 5.34381C6.64778 5.4619 6.68468 5.56524 6.76833 5.65381C6.85198 5.74238 6.95778 5.78667 7.08571 5.78667ZM3.54286 9.44762C3.2181 9.44762 2.94008 9.33198 2.70881 9.10071C2.47754 8.86944 2.3619 8.59143 2.3619 8.26667V1.18095C2.3619 0.85619 2.47754 0.578175 2.70881 0.346905C2.94008 0.115635 3.2181 0 3.54286 0H10.6286C10.9533 0 11.2313 0.115635 11.4626 0.346905C11.6939 0.578175 11.8095 0.85619 11.8095 1.18095V8.26667C11.8095 8.59143 11.6939 8.86944 11.4626 9.10071C11.2313 9.33198 10.9533 9.44762 10.6286 9.44762H3.54286ZM1.18095 11.8095C0.85619 11.8095 0.578175 11.6939 0.346905 11.4626C0.115635 11.2313 0 10.9533 0 10.6286V2.95238C0 2.78508 0.0565873 2.64484 0.169762 2.53167C0.282936 2.41849 0.423175 2.3619 0.590476 2.3619C0.757778 2.3619 0.898016 2.41849 1.01119 2.53167C1.12437 2.64484 1.18095 2.78508 1.18095 2.95238V10.6286H8.85714C9.02444 10.6286 9.16468 10.6852 9.27786 10.7983C9.39103 10.9115 9.44762 11.0517 9.44762 11.219C9.44762 11.3863 9.39103 11.5266 9.27786 11.6398C9.16468 11.7529 9.02444 11.8095 8.85714 11.8095H1.18095Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700">
                      Total Questions:
                    </div>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {questions.length}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 w-10 h-10 rounded-md flex items-center justify-center text-white">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.08571 7.67619C7.25302 7.67619 7.39817 7.61468 7.52119 7.49167C7.64421 7.36865 7.70571 7.22349 7.70571 7.05619C7.70571 6.88889 7.64421 6.74373 7.52119 6.62071C7.39817 6.4977 7.25302 6.43619 7.08571 6.43619C6.91841 6.43619 6.77325 6.4977 6.65024 6.62071C6.52722 6.74373 6.46571 6.88889 6.46571 7.05619C6.46571 7.22349 6.52722 7.36865 6.65024 7.49167C6.77325 7.61468 6.91841 7.67619 7.08571 7.67619ZM7.08571 5.78667C7.19397 5.78667 7.29484 5.7473 7.38833 5.66857C7.48183 5.58984 7.53841 5.48651 7.55809 5.35857C7.57778 5.24048 7.6196 5.13222 7.68357 5.03381C7.74754 4.9354 7.86317 4.80254 8.03048 4.63524C8.32571 4.34 8.52254 4.10135 8.62095 3.91929C8.71937 3.73722 8.76857 3.52317 8.76857 3.27714C8.76857 2.83429 8.61357 2.47262 8.30357 2.19214C7.99357 1.91167 7.58762 1.77143 7.08571 1.77143C6.76095 1.77143 6.46571 1.84524 6.2 1.99286C5.93429 2.14048 5.7227 2.35206 5.56524 2.62762C5.50619 2.72603 5.50127 2.82937 5.55048 2.93762C5.59968 3.04587 5.68333 3.1246 5.80143 3.17381C5.90968 3.22302 6.01548 3.22794 6.11881 3.18857C6.22214 3.14921 6.30825 3.08032 6.37714 2.9819C6.46571 2.85397 6.56905 2.75802 6.68714 2.69405C6.80524 2.63008 6.9381 2.5981 7.08571 2.5981C7.3219 2.5981 7.51381 2.66452 7.66143 2.79738C7.80905 2.93024 7.88286 3.10984 7.88286 3.33619C7.88286 3.47397 7.84349 3.60436 7.76476 3.72738C7.68603 3.8504 7.54825 4.0054 7.35143 4.19238C7.06603 4.43841 6.88397 4.62786 6.80524 4.76071C6.72651 4.89357 6.6773 5.08794 6.65762 5.34381C6.64778 5.4619 6.68468 5.56524 6.76833 5.65381C6.85198 5.74238 6.95778 5.78667 7.08571 5.78667ZM3.54286 9.44762C3.2181 9.44762 2.94008 9.33198 2.70881 9.10071C2.47754 8.86944 2.3619 8.59143 2.3619 8.26667V1.18095C2.3619 0.85619 2.47754 0.578175 2.70881 0.346905C2.94008 0.115635 3.2181 0 3.54286 0H10.6286C10.9533 0 11.2313 0.115635 11.4626 0.346905C11.6939 0.578175 11.8095 0.85619 11.8095 1.18095V8.26667C11.8095 8.59143 11.6939 8.86944 11.4626 9.10071C11.2313 9.33198 10.9533 9.44762 10.6286 9.44762H3.54286ZM1.18095 11.8095C0.85619 11.8095 0.578175 11.6939 0.346905 11.4626C0.115635 11.2313 0 10.9533 0 10.6286V2.95238C0 2.78508 0.0565873 2.64484 0.169762 2.53167C0.282936 2.41849 0.423175 2.3619 0.590476 2.3619C0.757778 2.3619 0.898016 2.41849 1.01119 2.53167C1.12437 2.64484 1.18095 2.78508 1.18095 2.95238V10.6286H8.85714C9.02444 10.6286 9.16468 10.6852 9.27786 10.7983C9.39103 10.9115 9.44762 11.0517 9.44762 11.219C9.44762 11.3863 9.39103 11.5266 9.27786 11.6398C9.16468 11.7529 9.02444 11.8095 8.85714 11.8095H1.18095Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700">
                      Questions Answered:
                    </div>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {String(answeredCount).padStart(3, "0")}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-700 w-10 h-10 rounded-md flex items-center justify-center text-white">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.08571 7.67619C7.25302 7.67619 7.39817 7.61468 7.52119 7.49167C7.64421 7.36865 7.70571 7.22349 7.70571 7.05619C7.70571 6.88889 7.64421 6.74373 7.52119 6.62071C7.39817 6.4977 7.25302 6.43619 7.08571 6.43619C6.91841 6.43619 6.77325 6.4977 6.65024 6.62071C6.52722 6.74373 6.46571 6.88889 6.46571 7.05619C6.46571 7.22349 6.52722 7.36865 6.65024 7.49167C6.77325 7.61468 6.91841 7.67619 7.08571 7.67619ZM7.08571 5.78667C7.19397 5.78667 7.29484 5.7473 7.38833 5.66857C7.48183 5.58984 7.53841 5.48651 7.55809 5.35857C7.57778 5.24048 7.6196 5.13222 7.68357 5.03381C7.74754 4.9354 7.86317 4.80254 8.03048 4.63524C8.32571 4.34 8.52254 4.10135 8.62095 3.91929C8.71937 3.73722 8.76857 3.52317 8.76857 3.27714C8.76857 2.83429 8.61357 2.47262 8.30357 2.19214C7.99357 1.91167 7.58762 1.77143 7.08571 1.77143C6.76095 1.77143 6.46571 1.84524 6.2 1.99286C5.93429 2.14048 5.7227 2.35206 5.56524 2.62762C5.50619 2.72603 5.50127 2.82937 5.55048 2.93762C5.59968 3.04587 5.68333 3.1246 5.80143 3.17381C5.90968 3.22302 6.01548 3.22794 6.11881 3.18857C6.22214 3.14921 6.30825 3.08032 6.37714 2.9819C6.46571 2.85397 6.56905 2.75802 6.68714 2.69405C6.80524 2.63008 6.9381 2.5981 7.08571 2.5981C7.3219 2.5981 7.51381 2.66452 7.66143 2.79738C7.80905 2.93024 7.88286 3.10984 7.88286 3.33619C7.88286 3.47397 7.84349 3.60436 7.76476 3.72738C7.68603 3.8504 7.54825 4.0054 7.35143 4.19238C7.06603 4.43841 6.88397 4.62786 6.80524 4.76071C6.72651 4.89357 6.6773 5.08794 6.65762 5.34381C6.64778 5.4619 6.68468 5.56524 6.76833 5.65381C6.85198 5.74238 6.95778 5.78667 7.08571 5.78667ZM3.54286 9.44762C3.2181 9.44762 2.94008 9.33198 2.70881 9.10071C2.47754 8.86944 2.3619 8.59143 2.3619 8.26667V1.18095C2.3619 0.85619 2.47754 0.578175 2.70881 0.346905C2.94008 0.115635 3.2181 0 3.54286 0H10.6286C10.9533 0 11.2313 0.115635 11.4626 0.346905C11.6939 0.578175 11.8095 0.85619 11.8095 1.18095V8.26667C11.8095 8.59143 11.6939 8.86944 11.4626 9.10071C11.2313 9.33198 10.9533 9.44762 10.6286 9.44762H3.54286ZM1.18095 11.8095C0.85619 11.8095 0.578175 11.6939 0.346905 11.4626C0.115635 11.2313 0 10.9533 0 10.6286V2.95238C0 2.78508 0.0565873 2.64484 0.169762 2.53167C0.282936 2.41849 0.423175 2.3619 0.590476 2.3619C0.757778 2.3619 0.898016 2.41849 1.01119 2.53167C1.12437 2.64484 1.18095 2.78508 1.18095 2.95238V10.6286H8.85714C9.02444 10.6286 9.16468 10.6852 9.27786 10.7983C9.39103 10.9115 9.44762 11.0517 9.44762 11.219C9.44762 11.3863 9.39103 11.5266 9.27786 11.6398C9.16468 11.7529 9.02444 11.8095 8.85714 11.8095H1.18095Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700">
                      Marked for review:
                    </div>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {String(markedCount).padStart(3, "0")}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    // confirm submit from modal
                    setShowSubmitModal(false);
                    doSubmit();
                  }}
                  disabled={submitting}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Test"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
