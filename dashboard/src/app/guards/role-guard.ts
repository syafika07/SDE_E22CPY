import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { SessionService } from '../services/session';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private router: Router,
    private logger : NGXLogger
  ) {}

  /**
   * CanActivate untuk route berbasis role
   * @param route ActivatedRouteSnapshot (ambil allowed roles dari route.data['roles'])
   */
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      // Ambil user dari session dulu
      let user = this.sessionService.getUser();

      // Jika belum ada session, ambil dari Supabase
      if (!user) {
        user = await this.supabaseService.getUser();
        if (!user) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return false;
        }
      }

      // Ambil role dari session
      let role: string = this.sessionService.getRole() ?? '';

      // Jika role kosong, ambil dari Supabase
      if (!role) {
        const profile = await this.supabaseService.getProfile(user.id);
        if (!profile) {
          // Optional: buat profile baru otomatis
          const newProfile = await this.supabaseService.createProfile(user.id, user.email ?? '', 'user');
          if (!newProfile) {
            this.router.navigate(['/login'], { replaceUrl: true });
            return false;
          }
          role = newProfile.role;
        } else {
          role = profile.role;
        }

        // Simpan session
        this.sessionService.startSession(user, role);
      }

      // Ambil roles yang dibenarkan dari route
      const allowedRoles: string[] = route.data['roles'] ?? [];

      // Jika role tidak termasuk, redirect ke dashboard
      if (allowedRoles.length && !allowedRoles.includes(role)) {
        this.router.navigate(['/login'], { replaceUrl: true });
        return false;
      }

      // Role sesuai → boleh akses
      return true;

    } catch (err) {
      this.logger.error('RoleGuard error:', err);
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
}
