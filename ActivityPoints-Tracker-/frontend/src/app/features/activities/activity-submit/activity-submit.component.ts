import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../../../ui/navbar/navbar.component';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Activity } from '../../../core/models/activity.model';

@Component({
  selector: 'app-activity-submit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './activity-submit.component.html',
  styleUrls: ['./activity-submit.component.scss']
})
export class ActivitySubmitComponent implements OnInit {
  activityForm: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  calculatedPoints = 0;
  today = new Date().toISOString().split('T')[0];
  
  activityTypes = ['sports', 'mooc', 'workshops', 'internships'];
  levels = [1, 2, 3, 4, 5];
  semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  private sportsPointsMap: Record<number, number> = {
    1: 8,
    2: 15,
    3: 25,
    4: 40,
    5: 50
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private activityService: ActivityService,
    private router: Router
  ) {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required]],
      activityType: ['', [Validators.required]],
      description: ['', [Validators.required]],
      eventOrganizer: ['', [Validators.required]],
      date: ['', [Validators.required]],
      level: [''],
      points: [0],
      semester: ['', [Validators.required, Validators.min(1), Validators.max(8)]]
    });

    // Calculate points when activity type or level changes
    this.activityForm.get('activityType')?.valueChanges.subscribe(() => {
      this.calculatePoints();
      this.updateLevelValidation();
    });

    this.activityForm.get('level')?.valueChanges.subscribe(() => {
      this.calculatePoints();
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  updateLevelValidation(): void {
    const activityType = this.activityForm.get('activityType')?.value;
    const levelControl = this.activityForm.get('level');

    if (activityType === 'sports') {
      levelControl?.setValidators([Validators.required, Validators.min(1), Validators.max(5)]);
    } else {
      levelControl?.clearValidators();
    }
    levelControl?.updateValueAndValidity();
  }

  calculatePoints(): void {
    const activityType = this.activityForm.get('activityType')?.value;
    const level = Number(this.activityForm.get('level')?.value);

    if (!activityType) {
      this.calculatedPoints = 0;
      return;
    }

    switch (activityType) {
      case 'sports':
        this.calculatedPoints = this.sportsPointsMap[level] || 0;
        break;
      case 'mooc':
        this.calculatedPoints = 50;
        break;
      case 'workshops':
        this.calculatedPoints = 6;
        break;
      case 'internships':
        this.calculatedPoints = 20;
        break;
      default:
        this.calculatedPoints = 0;
    }
    
    this.activityForm.patchValue({ points: this.calculatedPoints }, { emitEvent: false });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 5MB limit';
        event.target.value = '';
        this.selectedFile = null;
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Invalid file type. Please upload PDF, JPG, JPEG, or PNG files only';
        event.target.value = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  onSubmit(): void {
    if (this.activityForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      Object.keys(this.activityForm.controls).forEach(key => {
        const control = this.activityForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = 'Please upload a certificate.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Create FormData object
    const formData = new FormData();
    
    // Add the file with the correct field name
    console.log('File being uploaded:', this.selectedFile);
    formData.append('certificate', this.selectedFile, this.selectedFile.name);
    
    // Add all form values to formData, ensuring proper type conversion
    const formValues = this.activityForm.value;
    console.log('Form values:', formValues);

    // Append form fields with proper type conversion
    formData.append('activityType', formValues.activityType);
    formData.append('title', formValues.title.trim());
    formData.append('description', formValues.description.trim());
    formData.append('eventOrganizer', (formValues.eventOrganizer || 'Not specified').trim());
    formData.append('date', new Date(formValues.date).toISOString());
    formData.append('semester', formValues.semester.toString());
    formData.append('points', this.calculatedPoints.toString());
    
    // Only append level for sports activities
    if (formValues.activityType === 'sports' && formValues.level) {
      formData.append('level', formValues.level.toString());
    }

    // Add student information
    if (this.currentUser && this.currentUser._id && this.currentUser.name && 
        this.currentUser.class && this.currentUser.department) {
      formData.append('studentId', this.currentUser._id);
      formData.append('studentName', this.currentUser.name);
      formData.append('studentClass', this.currentUser.class);
      formData.append('studentDepartment', this.currentUser.department);
    } else {
      console.error('Missing required user information');
      this.errorMessage = 'Missing user information. Please log in again.';
      this.isSubmitting = false;
      return;
    }

    // Log the complete FormData
    console.log('FormData entries:');
    formData.forEach((value, key) => {
      console.log(key, ':', value);
    });

    this.activityService.submitActivity(formData).subscribe({
      next: (response: ApiResponse<Activity>) => {
        console.log('Submission successful:', response);
        this.isSubmitting = false;
        this.successMessage = response.message || 'Activity submitted successfully! Your certificate will be reviewed by your teacher.';
        
        // Reset form
        this.activityForm.reset();
        this.selectedFile = null;
        
        // Reset file input
        const fileInput = document.getElementById('certificateFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Reset form to initial state
        this.activityForm.patchValue({
          activityType: '',
          level: '',
          points: 0
        });
        this.calculatedPoints = 0;
        
        setTimeout(() => {
          this.router.navigate(['/activities']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Submission error:', error);
        this.isSubmitting = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.status === 413) {
          this.errorMessage = 'File size is too large. Please upload a smaller file.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          this.errorMessage = 'Failed to submit activity. Please try again.';
        }
        // Log detailed error information
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
      }
    });
  }
} 