import { User } from './user.model';

export interface Activity {
  _id: string;
  student: User | string;
  activityType: 'sports' | 'mooc' | 'workshops' | 'internships';
  title: string;
  description: string;
  eventOrganizer: string;
  level?: number;
  date: Date | string;
  certificateFile: string;
  points: number;
  pointsAwarded: number;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewedBy?: User | string;
  reviewedAt?: Date | string;
  createdAt: Date | string;
  studentClass?: string;
  studentDepartment?: string;
  semester: number;
} 