import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { SessionService } from '../services/session';
import { NGXLogger } from 'ngx-logger';
import { ROUTES } from '../routes-map';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private checkingUser = false;

  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private router: Router,
    private logger: NGXLogger
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const url = state.url.split('?')[0];
    const REPORT_PREFIXES = [
      '/report',           // semua /report/*
      '/report-collection'  // semua /report-collection/*
    ];

    if (REPORT_PREFIXES.some(prefix => url.startsWith(prefix))) {
      return true;
    }



    try {
      // 1️⃣ Cek sessionService dulu
      if (this.sessionService.isLoggedIn()) {
        return this.checkRole(route);
      }

      // 2️⃣ Elak multiple parallel check
      if (this.checkingUser) return false;
      this.checkingUser = true;

      // 3️⃣ Ambil user dari Supabase
      const user = await this.supabaseService.getUser();
      if (!user) {
        this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
        return false;
      }

      // 4️⃣ Ambil profile
      let profile = await this.supabaseService.getProfile(user.id);
      if (!profile) {
        profile = await this.supabaseService.createProfile(user.id, user.email ?? '', 'user');
        if (!profile) {
          this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
          return false;
        }
      }

      // 5️⃣ Simpan session
      const role = profile.role ?? 'user';
      this.sessionService.startSession(user, role);

      // 6️⃣ Cek role jika ada requirement
      return this.checkRole(route);

    } catch (err) {
      this.logger.error('AuthGuard error:', err);
      this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
      return false;
    } finally {
      this.checkingUser = false;
    }
  }

  private checkRole(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'] as string | undefined;
    const role = this.sessionService.getRole() ?? 'user';

    if (!requiredRole) return true;

    if (!this.sessionService.hasRole(requiredRole)) {
      this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
      return false;
    }

    return true;
  }
}
