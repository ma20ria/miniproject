import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry, map } from 'rxjs/operators';
import { Activity } from '../models/activity.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

// Define the API response interfaces
interface PendingActivitiesResponse {
  success: boolean;
  count: number;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
  data: Activity[];
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = 'http://localhost:5000/api/activities';

  constructor(private http: HttpClient) { }

  submitActivity(activityData: FormData): Observable<ApiResponse<Activity>> {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    // Set up headers with authentication but WITHOUT content-type
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Submitting activity with URL:', this.apiUrl);
    console.log('Headers:', headers);
    console.log('FormData contents:');
    activityData.forEach((value, key) => {
      console.log(key, ':', value);
    });

    // Return the POST request without observe: 'events' for simpler handling
    return this.http.post<ApiResponse<Activity>>(this.apiUrl, activityData, { 
      headers,
      reportProgress: true
    }).pipe(
      timeout(60000), // 60 second timeout for file uploads
      retry(1), // Retry failed requests once
      catchError(this.handleError)
    );
  }

  getMyActivities(): Observable<ApiResponse<Activity[]>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ApiResponse<Activity[]>>(this.apiUrl, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getPendingActivities(): Observable<PendingActivitiesResponse> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PendingActivitiesResponse>(`${this.apiUrl}/pending`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  reviewActivity(id: string, reviewData: { status: 'approved' | 'rejected', feedback?: string, pointsAwarded?: number }): Observable<ApiResponse<Activity>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ApiResponse<Activity>>(`${this.apiUrl}/${id}/review`, reviewData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllActivities(): Observable<ApiResponse<Activity[]>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ApiResponse<Activity[]>>(`${this.apiUrl}/all`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  generateReport(params: { 
    teacherId?: string;
    studentIds?: string;
    department?: string; 
    class?: string;
    semester?: string; 
    status?: string 
  } = {}): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const queryParams = new URLSearchParams();
    
    if (params.teacherId) queryParams.append('teacherId', params.teacherId);
    if (params.studentIds) queryParams.append('studentIds', params.studentIds);
    if (params.department) queryParams.append('department', params.department);
    if (params.class) queryParams.append('class', params.class);
    if (params.semester) queryParams.append('semester', params.semester);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `${this.apiUrl}/report?${queryParams.toString()}`;
    return this.http.get<any>(url, { headers });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else {
        errorMessage = `Error Code: ${error.status}, Message: ${error.message}`;
      }
    }
    
    console.error('Formatted error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
} 