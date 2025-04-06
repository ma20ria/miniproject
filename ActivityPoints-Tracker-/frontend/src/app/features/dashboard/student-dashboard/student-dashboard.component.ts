import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { NavbarComponent } from '../../../ui/navbar/navbar.component';
import { User } from '../../../core/models/user.model';
import { Activity } from '../../../core/models/activity.model';
import { interval, Subscription } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgChartsModule, NavbarComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  currentUser: User | null = null;
  activities: Activity[] = [];
  isLoading: boolean = true;
  private refreshSubscription?: Subscription;
  
  // Activity stats
  totalActivities: number = 0;
  pendingActivities: number = 0;
  approvedActivities: number = 0;
  rejectedActivities: number = 0;
  totalPoints: number = 0;
  categoryPoints: number = 0;
  
  // Doughnut chart
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        hoverOffset: 4
      }
    ]
  };
  
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    layout: {
      padding: 10
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 11
          },
          boxWidth: 12
        }
      }
    }
  };
  
  // Bar chart for activity types
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'],
    datasets: [
      {
        data: [15, 20, 25, 30, 35, 40, 45, 50],
        label: 'Points Earned',
        backgroundColor: '#007bff',
        borderColor: '#007bff',
        borderWidth: 1,
        barThickness: 30,
        maxBarThickness: 40
      }
    ]
  };
  
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
          font: {
            size: 12
          }
        },
        grid: {
          color: '#f0f0f0'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            return `Points: ${context.raw}`;
          }
        }
      }
    },
    animation: {
      duration: 500
    }
  };

  constructor(
    private authService: AuthService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadActivities();
    
    // Set up automatic refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadActivities();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadActivities(): void {
    this.isLoading = true;
    
    this.activityService.getMyActivities().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.activities = response.data;
          console.log('Activities loaded:', this.activities);
          this.calculateStats();
          this.updateCharts();
          
          // Force another chart update after a short delay
          setTimeout(() => {
            this.chart?.update();
          }, 100);
        } else {
          this.activities = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
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

    this.categoryPoints = this.activities
      .filter(activity => activity.status === 'approved')
      .reduce((sum, activity) => sum + (activity.pointsAwarded || 0), 0);
  }

  updateCharts(): void {
    // Update doughnut chart
    this.doughnutChartData.datasets[0].data = [
      this.approvedActivities,
      this.pendingActivities,
      this.rejectedActivities
    ];
    
    // Update bar chart with points by semester
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
    const pointsBySemester = semesters.map(semester => {
      const semesterPoints = this.activities
        .filter(a => a.status === 'approved' && Number(a.semester) === semester)
        .reduce((sum, activity) => sum + (Number(activity.pointsAwarded) || 0), 0);
      console.log(`Semester ${semester} points:`, semesterPoints);
      return semesterPoints;
    });
    
    console.log('Points by semester:', pointsBySemester);
    
    // Create new dataset with updated data
    const newDataset = {
      ...this.barChartData.datasets[0],
      data: pointsBySemester
    };

    // Update chart data with new dataset
    this.barChartData = {
      labels: this.barChartData.labels,
      datasets: [newDataset]
    };

    // Force chart update
    if (this.chart) {
      this.chart.render();
      setTimeout(() => {
        this.chart?.update();
      }, 100);
    }
  }
  
  // Helper method to determine semester from activity date
  getSemesterFromDate(date: Date | string): number {
    const activityDate = new Date(date);
    const currentYear = new Date().getFullYear();
    const activityYear = activityDate.getFullYear();
    const yearDiff = currentYear - activityYear;
    
    // Determine if it's first or second half of the year (semester 1 or 2 within a year)
    const isSecondHalf = activityDate.getMonth() >= 6; // July onwards is second semester
    
    // Calculate semester based on year difference and half of year
    // Assuming student is currently in 8th semester at most
    const maxSemesters = 8;
    const currentSemester = Math.min(maxSemesters, (yearDiff * 2) + (isSecondHalf ? 2 : 1));
    
    // Return a semester between 1 and 8
    return Math.max(1, currentSemester);
  }
} 