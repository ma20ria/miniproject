import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { NavbarComponent } from '../../../ui/navbar/navbar.component';
import { User } from '../../../core/models/user.model';
import { Activity } from '../../../core/models/activity.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NavbarComponent],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: User | null = null;
  pendingActivities: Activity[] = [];
  isLoading: boolean = true;
  selectedActivity: Activity | null = null;
  reviewForm: FormGroup;
  
  // Activity stats
  totalPendingRequests: number = 0;
  totalApprovedRequests: number = 0;
  totalRejectedRequests: number = 0;
  
  constructor(
    private authService: AuthService,
    private activityService: ActivityService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      status: ['approved'],
      feedback: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPendingActivities();
  }

  // Helper method to check if student is a User object
  isUserObject(student: User | string): student is User {
    return typeof student === 'object';
  }

  // Helper method to get the correct certificate URL
  getCertificateUrl(certificateFile: string): string {
    // Ensure we have a valid certificate file path
    if (!certificateFile) {
      console.warn('No certificate file path provided');
      return '';
    }
    
    console.log('Original certificate path:', certificateFile);
    
    // Extract just the filename if it's a full path
    let filename = certificateFile;
    if (certificateFile.includes('\\')) {
      filename = certificateFile.split('\\').pop() || '';
    } else if (certificateFile.includes('/')) {
      filename = certificateFile.split('/').pop() || '';
    }
    
    // Construct the URL with uploads prefix
    const finalUrl = `http://localhost:5000/uploads/${certificateFile}`;
    console.log('Final certificate URL:', finalUrl);
    return finalUrl;
  }

  loadPendingActivities(): void {
    this.isLoading = true;
    
    this.activityService.getPendingActivities().subscribe({
      next: (response) => {
        if (response && response.data) {
          // Ensure points are properly set for each activity
          this.pendingActivities = response.data.map(activity => ({
            ...activity,
            points: activity.points || this.calculateActivityPoints(activity)
          }));
          
          // Update stats from the response
          if (response.stats) {
            this.totalPendingRequests = response.stats.pending || 0;
            this.totalApprovedRequests = response.stats.approved || 0;
            this.totalRejectedRequests = response.stats.rejected || 0;
          } else {
            this.calculateStats();
          }
        } else {
          this.pendingActivities = [];
          this.calculateStats();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending activities:', error);
        this.isLoading = false;
        this.pendingActivities = [];
        this.calculateStats();
      }
    });
  }

  // Helper method to calculate points based on activity type and level
  private calculateActivityPoints(activity: Activity): number {
    const sportsPointsMap: { [key: number]: number } = {
      1: 8,
      2: 15,
      3: 25,
      4: 40,
      5: 50
    };

    switch (activity.activityType) {
      case 'sports':
        return activity.level ? sportsPointsMap[activity.level] || 0 : 0;
      case 'mooc':
        return 50;
      case 'workshops':
        return 6;
      case 'internships':
        return 20;
      default:
        return 0;
    }
  }

  calculateStats(): void {
    // Calculate stats based on actual data
    this.totalPendingRequests = this.pendingActivities.length;
    
    // In a real application, you would fetch these counts from the server
    // For now, we'll set some placeholder values
    this.totalApprovedRequests = 5;
    this.totalRejectedRequests = 2;
  }

  selectActivity(activity: Activity): void {
    this.selectedActivity = activity;
    
    // Set form values
    this.reviewForm.patchValue({
      status: 'approved',
      feedback: ''
    });
  }

  submitReview(): void {
    if (!this.selectedActivity || !this.reviewForm.valid) {
      return;
    }
    
    const reviewData = {
      status: this.reviewForm.get('status')?.value || 'pending',
      pointsAwarded: this.selectedActivity.points,  // Use the points from the activity
      feedback: this.reviewForm.get('feedback')?.value || ''
    };
    
    this.activityService.reviewActivity(this.selectedActivity._id, reviewData).subscribe({
      next: (response) => {
        // Update the activity in the list
        const index = this.pendingActivities.findIndex(a => a._id === this.selectedActivity?._id);
        if (index !== -1) {
          this.pendingActivities.splice(index, 1);
        }
        
        // Update stats
        this.calculateStats();
        
        // Close the modal
        this.selectedActivity = null;
      },
      error: (error) => {
        console.error('Error submitting review:', error);
      }
    });
  }
} 