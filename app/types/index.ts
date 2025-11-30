/* eslint-disable @typescript-eslint/no-explicit-any */
export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  qualification: string;
  profile_image?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface Question {
  id: number;           // This should map to question_id from API
  question_id?: number; // Add this to handle API response
  question: string;
  options: Option[];
  marks: number;
  number?: number;      // Add this from API
  comprehension?: string | null;
  image?: string | null;
}

export interface Option {
  id: number;
  option: string;
}

export interface Answer {
  question_id: number;
  selected_option_id: number | null;
  marked_for_review?: boolean;
  visited?: boolean; // <--- new
}

export interface ExamResult {
  exam_history_id: string;
  score: number;
  correct: number;
  wrong: number;
  not_attended: number;
  submitted_at: string;
  details: QuestionDetail[];
}

export interface QuestionDetail {
  question_id: number;
  selected_option_id: number | null;
  correct_option_id: number;
  is_correct: boolean;
}

export interface ExamInfo {
  questions_count: number;
  total_marks: number;
  total_time: number;
  time_for_each_question: number;
  mark_per_each_answer: number;
  instruction: string;
}

export interface ExamState {
  questions: Question[];
  currentQuestion: number;
  answers: Answer[];
  timeRemaining: number;
  examStarted: boolean;
  examSubmitted: boolean;
  examInfo: ExamInfo | null;
  result: ExamResult | null;
  reviewQuestions: number[];
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}