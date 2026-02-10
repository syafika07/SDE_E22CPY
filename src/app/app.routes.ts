import { AuthGuard } from './guards/auth-guard';
import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role-guard';
import { ROUTES } from './routes-map';

export const routes: Routes = [
  { path: '', redirectTo: ROUTES.LOGIN, pathMatch: 'full' },

  {
    path: ROUTES.UPLOAD_DATA,
    loadComponent: () => import('./pages/upload-data/upload-data.page').then(m => m.UploadDataPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user','admin','proadmin'] }
  },
  {
    path: ROUTES.DASHBOARD,
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user','admin','proadmin'] }
  },
  {
    path: ROUTES.TNG,
    loadComponent: () => import('./pages/tng/tng.page').then(m => m.TngPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user','admin','proadmin'] }
  },
  {
    path: ROUTES.TNGC,
    loadComponent: () => import('./pages/tngc/tngc.page').then(m => m.TngPagec),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin','proadmin'] }
  },
  {
    path: ROUTES.LOGIN,
    loadComponent: () => import('./credentials/login/login.page').then(m => m.LoginPage)
  },
  {
    path: ROUTES.REGISTER,
    loadComponent: () => import('./credentials/register/register.page').then( m => m.RegisterPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['proadmin'] }
  },
  {
    path: ROUTES.UPDATE_ADMIN,
    loadComponent: () => import('./credentials/update-admin/update-admin.page').then( m => m.UpdateAdminPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['proadmin'] }
  },
    {
    path: ROUTES.ADD_INFO,
    loadComponent: () => import('./pages/add-info/add-info.page').then( m => m.AddInfoPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['editor'] }
  },
  {
    path: ROUTES.EDIT_INFO,
    loadComponent: () => import('./pages/edit-info/edit-info.page').then( m => m.EditInfoPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['editor'] }
  },
  {
    path: ROUTES.TV_DISPLAY,
    loadComponent: () => import('./pages/tv-display/tv-display.page').then( m => m.TvDisplayPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['editor'] }
  },
  {
    path: ROUTES.RESET_PASS,
    loadComponent: () => import('./credentials/reset-password/reset-password.page').then( m => m.ResetPasswordPage),
  },
  {
    path: ROUTES.PROFILE,
    loadComponent: () => import('./credentials/profile/profile.page').then( m => m.ProfilePage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['editor','proadmin','admin','user'] }
  },
  {
    path: ROUTES.CHANGES,
    loadComponent: () => import('./credentials/change-success/change-success.page').then( m => m.ChangeSuccessPage)
  },
  {
    path: ROUTES.REPORT,
    loadComponent: () => import('./pages/report/report.page').then( m => m.ReportPage)
  },
  {
    path: ROUTES.REPORT_COLLECTION,
    loadComponent: () => import('./pages/report-collection/report-collection.page').then( m => m.ReportCollectionPage)
  },
  {
    path: 'segment',
    loadComponent: () => import('./pages/segment/segment.page').then( m => m.SegmentPage)
  },

];
