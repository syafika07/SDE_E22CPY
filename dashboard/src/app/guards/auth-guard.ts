import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { SessionService } from '../services/session';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private router: Router,
    private logger : NGXLogger
  ) {}

  /**
   * CanActivate guard untuk route
   * @param route ActivatedRouteSnapshot (optional role check)
   */
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      // Cek dulu session lokal
      if (this.sessionService.isLoggedIn()) {
        // Jika ada role requirement
        const requiredRole = route.data['role'] as string | undefined;
        if (requiredRole && !this.sessionService.hasRole(requiredRole)) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return false;
        }
        return true;
      }

      // Ambil user dari Supabase jika session belum ada
      const user = await this.supabaseService.getUser();

      if (!user) {
        // User belum login → redirect ke login
        this.router.navigate(['/login'], { replaceUrl: true });
        return false;
      }

      // Ambil profile (role)
      let profile = await this.supabaseService.getProfile(user.id);

      // Jika profile belum ada, buat baru dengan role 'user'
      if (!profile) {
        profile = await this.supabaseService.createProfile(user.id, user.email ?? '', 'user');
        if (!profile) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return false;
        }
      }

      // Simpan session di client
      this.sessionService.startSession(user, profile.role);

      // Cek role jika ada requirement
      const requiredRole = route.data['role'] as string | undefined;
      if (requiredRole && !this.sessionService.hasRole(requiredRole)) {
        this.router.navigate(['/login'], { replaceUrl: true });
        return false;
      }

      return true;

    } catch (err) {
      this.logger.error('AuthGuard error:', err);
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
}
