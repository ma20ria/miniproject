import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { NavbarComponent } from '../../../ui/navbar/navbar.component';
import { User } from '../../../core/models/user.model';
import { Activity } from '../../../core/models/activity.model';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit {
  currentUser: User | null = null;
  activities: Activity[] = [];
  isLoading: boolean = true;
  
  // Activity stats
  totalActivities: number = 0;
  pendingActivities: number = 0;
  approvedActivities: number = 0;
  rejectedActivities: number = 0;
  totalPoints: number = 0;
  
  // Filters
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  
  activityTypes = ['sports', 'mooc', 'workshops', 'internships'];

  constructor(
    private authService: AuthService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;
    
    this.activityService.getMyActivities().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.activities = response.data;
          this.calculateStats();
        } else {
          this.activities = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.activities = [];
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalActivities = this.activities.length;
    this.pendingActivities = this.activities.filter(a => a.status === 'pending').length;
    this.approvedActivities = this.activities.filter(a => a.status === 'approved').length;
    this.rejectedActivities = this.activities.filter(a => a.status === 'rejected').length;
    
    this.totalPoints = this.activities
      .filter(activity => activity.status === 'approved')
      .reduce((sum, activity) => sum + (activity.pointsAwarded || 0), 0);
  }
  
  filterActivities(): Activity[] {
    return this.activities.filter(activity => {
      // Filter by status
      if (this.statusFilter !== 'all' && activity.status !== this.statusFilter) {
        return false;
      }
      
      // Filter by type
      if (this.typeFilter !== 'all' && activity.activityType !== this.typeFilter) {
        return false;
      }
      
      return true;
    });
  }
  
  setStatusFilter(status: string): void {
    this.statusFilter = status;
  }
  
  setTypeFilter(type: string): void {
    this.typeFilter = type;
  }
  
  resetFilters(): void {
    this.statusFilter = 'all';
    this.typeFilter = 'all';
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
} 