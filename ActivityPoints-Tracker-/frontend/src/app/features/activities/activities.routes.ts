import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const ACTIVITIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./activity-list/activity-list.component').then(m => m.ActivityListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'submit',
    loadComponent: () => import('./activity-submit/activity-submit.component').then(m => m.ActivitySubmitComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] }
  }
]; 