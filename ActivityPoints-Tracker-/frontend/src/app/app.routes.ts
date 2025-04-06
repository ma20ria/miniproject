import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    children: [
      {
        path: 'student',
        loadComponent: () => import('./features/dashboard/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['student'] }
      },
      {
        path: 'teacher',
        loadComponent: () => import('./features/dashboard/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['teacher'] }
      },
      {
        path: 'teacher/report',
        loadComponent: () => import('./features/dashboard/teacher-dashboard/report/report.component').then(m => m.ReportComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['teacher'] }
      }
    ]
  },
  {
    path: 'activities',
    loadChildren: () => import('./features/activities/activities.routes').then(m => m.ACTIVITIES_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'activities/submit',
    loadComponent: () => import('./features/activities/activity-submit/activity-submit.component').then(m => m.ActivitySubmitComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
]; 