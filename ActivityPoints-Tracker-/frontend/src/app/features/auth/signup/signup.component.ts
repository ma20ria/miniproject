import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../ui/navbar/navbar.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  
  roleOptions = ['student', 'teacher', 'superadmin'];
  departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Biotechnology'
  ];
  semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['student', Validators.required],
      department: [''],
      semester: [''],
      class: [''],
      rollNumber: [''],
      teacherClass: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onRoleChange(): void {
    const role = this.signupForm.get('role')?.value;
    
    if (role === 'student' || role === 'teacher') {
      this.signupForm.get('department')?.setValidators(Validators.required);
    } else {
      this.signupForm.get('department')?.clearValidators();
    }
    
    if (role === 'student') {
      this.signupForm.get('semester')?.setValidators(Validators.required);
      this.signupForm.get('class')?.setValidators(Validators.required);
      this.signupForm.get('rollNumber')?.setValidators(Validators.required);
      this.signupForm.get('teacherClass')?.clearValidators();
    } else if (role === 'teacher') {
      this.signupForm.get('semester')?.clearValidators();
      this.signupForm.get('class')?.clearValidators();
      this.signupForm.get('rollNumber')?.clearValidators();
      this.signupForm.get('teacherClass')?.setValidators(Validators.required);
    } else {
      this.signupForm.get('semester')?.clearValidators();
      this.signupForm.get('class')?.clearValidators();
      this.signupForm.get('rollNumber')?.clearValidators();
      this.signupForm.get('teacherClass')?.clearValidators();
    }
    
    this.signupForm.get('department')?.updateValueAndValidity();
    this.signupForm.get('semester')?.updateValueAndValidity();
    this.signupForm.get('class')?.updateValueAndValidity();
    this.signupForm.get('rollNumber')?.updateValueAndValidity();
    this.signupForm.get('teacherClass')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Remove confirmPassword before sending to API
    const userData = { ...this.signupForm.value };
    delete userData.confirmPassword;

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard', response.user.role]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error.message || 'Registration failed. Please try again.';
      }
    });
  }
} 