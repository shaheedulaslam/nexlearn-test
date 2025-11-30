/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://nexlearn.noviindusdemosites.in/';

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshTokenPromise) {
            return this.refreshTokenPromise.then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.refreshTokenPromise = this.refreshToken();

          try {
            const newToken = await this.refreshTokenPromise;
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', newToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.handleLogout();
            return Promise.reject(refreshError);
          } finally {
            this.refreshTokenPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Note: You'll need to implement the actual refresh token endpoint
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { access_token } = response.data;
    return access_token;
  }

  private handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
    }
  }

  // Auth methods
  async sendOtp(mobile: string) {
    const formData = new FormData();
    formData.append('mobile', `+91${mobile}`);

    const response = await this.api.post('/auth/send-otp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async verifyOtp(mobile: string, otp: string) {
    const formData = new FormData();
    formData.append('mobile', `+91${mobile}`);
    formData.append('otp', otp);

    const response = await this.api.post('/auth/verify-otp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async createProfile(profileData: FormData) {
    const response = await this.api.post('/auth/create-profile', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    this.handleLogout();
    return response.data;
  }

  // Exam methods
async getQuestions() {
  const response = await this.api.get('/question/list');
  
  // Transform the API response to match your expected structure
  if (response.data.success) {
    return {
      ...response.data,
      questions: response.data.questions.map((q: any) => ({
        ...q,
        id: q.question_id, // Map question_id to id
        marks: 1 // Default marks since API doesn't provide it
      }))
    };
  }
  return response.data;
}

// In your apiService.ts
async submitAnswers(answers: any[]) {
  try {
    // Format the answers properly with question_id
    const formattedAnswers = answers.map((answer, index) => ({
      question_id: answer.question_id, // Make sure this is included
      selected_option_id: answer.selected_option_id
    }));

    console.log('Submitting answers:', formattedAnswers); // Debug log

    const formData = new FormData();
    formData.append('answers', JSON.stringify(formattedAnswers));

    const response = await this.api.post('/answers/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Submit Answers Error:', error);
    throw error;
  }
}

  async getAuthHeaders() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
    return {};
  }

  // In your apiService
}
export const apiService = new ApiService();