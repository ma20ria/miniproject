import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api/users';

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/role/${role}`).pipe(
      map(response => response.data)
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, userData).pipe(
      map(response => response.data)
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getAssignedStudents(teacherId: string): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/teacher/${teacherId}/students`).pipe(
      map(response => response.data)
    );
  }
} 