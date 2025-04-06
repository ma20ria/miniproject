export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
  teacherCount?: number;
} 