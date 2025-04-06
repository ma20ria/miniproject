import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../../ui/navbar/navbar.component';
import { ActivityService } from '../../../../core/services/activity.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';

interface StudentReport {
  student: {
    name: string;
    rollNumber: string;
    class: string;
  };
  totalActivities: number;
  approvedActivities: number;
  pendingActivities: number;
  rejectedActivities: number;
  totalPoints: number;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="container py-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h1 class="mb-0">My Students Activity Report</h1>
            <a routerLink="/dashboard/teacher" class="btn btn-outline-primary">Back to Dashboard</a>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Loading report data...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- Report Table -->
      <div *ngIf="!isLoading && !error && reportData.length > 0" class="card shadow-sm">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Class</th>
                  <th>Total Activities</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let student of reportData">
                  <td>{{ student.student.name }}</td>
                  <td>{{ student.student.rollNumber }}</td>
                  <td>{{ student.student.class }}</td>
                  <td>{{ student.totalActivities }}</td>
                  <td>{{ student.approvedActivities }}</td>
                  <td>{{ student.pendingActivities }}</td>
                  <td>{{ student.rejectedActivities }}</td>
                  <td>{{ student.totalPoints }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div *ngIf="!isLoading && !error && reportData.length === 0" class="text-center py-5">
        <p class="text-muted mb-0">No students are currently assigned to you.</p>
      </div>
    </div>
  `,
  styles: [`
    .shadow-sm {
      box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important;
    }
    
    .table th {
      font-weight: 600;
      background-color: #f8f9fa;
    }
    
    .table td {
      vertical-align: middle;
    }
  `]
})
export class ReportComponent implements OnInit {
  reportData: StudentReport[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  currentUser: any = null;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }
    this.loadAssignedStudentsReport();
  }

  loadAssignedStudentsReport(): void {
    if (!this.currentUser?._id) {
      this.error = 'User ID not found';
      this.isLoading = false;
      return;
    }
    
    // First get the list of students assigned to this teacher
    this.userService.getAssignedStudents(this.currentUser._id).subscribe({
      next: (students) => {
        if (!students || students.length === 0) {
          this.reportData = [];
          this.isLoading = false;
          return;
        }

        // Get the student IDs
        const studentIds = students.map(student => student._id);

        // Now get activities report for these specific students
        this.activityService.generateReport({
          teacherId: this.currentUser._id,
          studentIds: studentIds.join(',')
        }).subscribe({
          next: (response) => {
            if (response && response.data) {
              this.reportData = response.data;
            } else {
              this.reportData = [];
            }
            this.isLoading = false;
          },
          error: (error) => {
            this.error = error.message || 'Failed to load report data';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load assigned students';
        this.isLoading = false;
      }
    });
  }
} 