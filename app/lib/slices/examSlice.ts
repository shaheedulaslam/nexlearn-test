/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ExamState, Question, Answer, ExamResult, ExamInfo } from "../../types";

const initialState: ExamState = {
  questions: [],
  currentQuestion: 0,
  answers: [],
  timeRemaining: 0,
  examStarted: false,
  examSubmitted: false,
  examInfo: null,
  result: null,
  reviewQuestions: [],
  loading: false,
  error: null,
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      // Map API response to match your expected structure
      const mappedQuestions = action.payload
        .map((q) => {
          if (typeof q.question_id !== "number") return null;
          return {
            ...q,
            id: q.question_id as number, // Ensure id is always a number
            marks: q.marks || 1, // Default to 1 mark if not provided
          };
        })
        .filter((q) => q !== null) as Question[];

      state.questions = mappedQuestions;
      // Initialize answers as empty array
      state.answers = [];
      state.currentQuestion = 0;

      if (state.timeRemaining === 0) {
        state.timeRemaining = 60 * 60;
      }
    },
    setExamInfo: (state, action: PayloadAction<ExamInfo>) => {
      state.examInfo = action.payload;
      state.timeRemaining = action.payload.total_time * 60;
    },
    setAnswer: (
      state,
      action: PayloadAction<{
        question_id: number;
        selected_option_id: number | null;
        marked_for_review?: boolean;
      }>
    ) => {
      const { question_id, selected_option_id, marked_for_review } =
        action.payload;
      let existing = state.answers.find((a) => a.question_id === question_id);
      if (!existing) {
        existing = {
          question_id,
          selected_option_id,
          marked_for_review: !!marked_for_review,
          visited: true, // set visited since user answered
        };
        state.answers.push(existing);
      } else {
        existing.selected_option_id = selected_option_id;
        if (typeof marked_for_review !== "undefined")
          existing.marked_for_review = marked_for_review;
        existing.visited = true; // user actions mean visited
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex < state.questions.length) {
        state.currentQuestion = newIndex;

        const qId = state.questions[newIndex]?.id;
        if (qId !== undefined) {
          const existing = state.answers.find((a) => a.question_id === qId);
          if (!existing) {
            state.answers.push({
              question_id: qId,
              selected_option_id: null,
              marked_for_review: false,
              visited: true, // mark visited when opened
            });
          } else {
            // ensure visited flagged if existing record present
            existing.visited = true;
          }
        }
      }
    },

    nextQuestion: (state) => {
      if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion += 1;
        // mark visited for the newly active question
        const qId = state.questions[state.currentQuestion]?.id;
        if (qId !== undefined) {
          const existing = state.answers.find((a) => a.question_id === qId);
          if (existing) existing.visited = true;
          else
            state.answers.push({
              question_id: qId,
              selected_option_id: null,
              marked_for_review: false,
              visited: true,
            });
        }
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestion > 0) {
        state.currentQuestion -= 1;
        const qId = state.questions[state.currentQuestion]?.id;
        if (qId !== undefined) {
          const existing = state.answers.find((a) => a.question_id === qId);
          if (existing) existing.visited = true;
          else
            state.answers.push({
              question_id: qId,
              selected_option_id: null,
              marked_for_review: false,
              visited: true,
            });
        }
      }
    },
    jumpToQuestion: (state, action: PayloadAction<number>) => {
      const questionIndex = action.payload;
      if (questionIndex >= 0 && questionIndex < state.questions.length) {
        state.currentQuestion = questionIndex;
        const qId = state.questions[questionIndex]?.id;
        if (qId !== undefined) {
          const existing = state.answers.find((a) => a.question_id === qId);
          if (existing) existing.visited = true;
          else
            state.answers.push({
              question_id: qId,
              selected_option_id: null,
              marked_for_review: false,
              visited: true,
            });
        }
      }
    },
    startExam: (state) => {
      state.examStarted = true;
      state.examSubmitted = false;
      state.error = null;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    decrementTime: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    submitExam: (state, action: PayloadAction<ExamResult>) => {
      state.examSubmitted = true;
      state.examStarted = false;
      state.result = action.payload;
    },
    resetExam: (state) => {
      state.questions = [];
      state.currentQuestion = 0;
      state.answers = [];
      state.timeRemaining = 0;
      state.examStarted = false;
      state.examSubmitted = false;
      state.examInfo = null;
      state.result = null;
      state.reviewQuestions = [];
      state.loading = false;
      state.error = null;
    },
    clearAnswer: (state, action: PayloadAction<number>) => {
      const questionId = action.payload;
      const answerIndex = state.answers.findIndex(
        (answer) => answer.question_id === questionId
      );

      if (answerIndex !== -1) {
        state.answers[answerIndex].selected_option_id = null;
        // keep visited true (user opened it)
        state.answers[answerIndex].visited = true;
      }
    },
    clearAllAnswers: (state) => {
      state.answers = state.answers.map((answer) => ({
        ...answer,
        selected_option_id: null,
        // preserve visited flags
      }));
    },
    markForReview: (state, action: PayloadAction<number>) => {
      const questionId = action.payload;
      const answerIndex = state.answers.findIndex(
        (answer) => answer.question_id === questionId
      );

      if (answerIndex !== -1) {
        state.answers[answerIndex].marked_for_review = true;
        state.answers[answerIndex].visited = true;
      } else {
        // Create answer entry if it doesn't exist
        state.answers.push({
          question_id: questionId,
          selected_option_id: null,
          marked_for_review: true,
          visited: true,
        });
      }

      // Add to review questions array if not already present
      if (!state.reviewQuestions.includes(questionId)) {
        state.reviewQuestions.push(questionId);
      }
    },
    unmarkReview: (state, action: PayloadAction<number>) => {
      const questionId = action.payload;
      const answerIndex = state.answers.findIndex(
        (answer) => answer.question_id === questionId
      );

      if (answerIndex !== -1) {
        state.answers[answerIndex].marked_for_review = false;
        state.answers[answerIndex].visited = true;
      }

      // Remove from review questions array
      state.reviewQuestions = state.reviewQuestions.filter(
        (id) => id !== questionId
      );
    },
    toggleMarkForReview: (state, action: PayloadAction<number>) => {
      const questionId = action.payload;
      const answerIndex = state.answers.findIndex(
        (answer) => answer.question_id === questionId
      );

      if (answerIndex !== -1 && state.answers[answerIndex].marked_for_review) {
        // Already marked, so unmark it
        state.answers[answerIndex].marked_for_review = false;
        state.answers[answerIndex].visited = true;
        state.reviewQuestions = state.reviewQuestions.filter(
          (id) => id !== questionId
        );
      } else {
        // Mark for review
        if (answerIndex !== -1) {
          state.answers[answerIndex].marked_for_review = true;
          state.answers[answerIndex].visited = true;
        } else {
          state.answers.push({
            question_id: questionId,
            selected_option_id: null,
            marked_for_review: true,
            visited: true,
          });
        }

        if (!state.reviewQuestions.includes(questionId)) {
          state.reviewQuestions.push(questionId);
        }
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setQuestions,
  setExamInfo,
  setAnswer,
  setCurrentQuestion,
  nextQuestion,
  previousQuestion,
  jumpToQuestion,
  startExam,
  updateTimeRemaining,
  decrementTime,
  submitExam,
  resetExam,
  clearAnswer,
  clearAllAnswers,
  markForReview,
  unmarkReview,
  toggleMarkForReview,
} = examSlice.actions;

export default examSlice.reducer;
