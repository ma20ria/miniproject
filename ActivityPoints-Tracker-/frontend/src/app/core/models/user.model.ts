export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'superadmin';
  department?: string;
  semester?: number;
  class?: string;
  rollNumber?: string;
  createdAt: Date;
} 