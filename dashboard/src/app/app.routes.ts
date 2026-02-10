import { AuthGuard } from './guards/auth-guard';
import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'upload-data',
    loadComponent: () => import('./pages/upload-data/upload-data.page').then(m => m.UploadDataPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin','proadmin'] }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user','admin','proadmin'] }
  },
  {
    path: 'tng',
    loadComponent: () => import('./pages/tng/tng.page').then(m => m.TngPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user','admin','proadmin'] }            // role yang dibenarkan

  },
  {
    path: 'tngc',
    loadComponent: () => import('./pages/tngc/tngc.page').then(m => m.TngPagec),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user','admin','proadmin'] }            // role yang dibenarkan

  },
  {
    path: 'login',
    loadComponent: () => import('./credentials/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./credentials/register/register.page').then( m => m.RegisterPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['proadmin'] }
  },
  {
    path: 'update-admin',
    loadComponent: () => import('./credentials/update-admin/update-admin.page').then( m => m.UpdateAdminPage)
  },
];
