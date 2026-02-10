import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { SessionService } from '../services/session';
import { NGXLogger } from 'ngx-logger';
import { ROUTES } from '../routes-map';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  private checkingUser = false;

  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private router: Router,
    private logger: NGXLogger
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    try {
      // 1️⃣ Ambil user & role dari sessionService
      let user = this.sessionService.getUser();
      let role = this.sessionService.getRole() ?? 'user';

      // 2️⃣ Jika belum ada session → fetch dari Supabase
      if (!user) {
        if (this.checkingUser) return false;
        this.checkingUser = true;

        user = await this.supabaseService.getUser();
        if (!user) {
        this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
          return false;
        }

        let profile = await this.supabaseService.getProfile(user.id);
        if (!profile) {
          profile = await this.supabaseService.createProfile(user.id, user.email ?? '', 'user');
          if (!profile) {
          this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
            return false;
          }
        }

        role = profile.role ?? 'user';
        this.sessionService.startSession(user, role);

        this.checkingUser = false;
      }

      // 3️⃣ Ambil allowed roles dari route
      const allowedRoles: string[] = route.data['roles'] ?? [];

      // 4️⃣ Cek role → kalau tak match → redirect
      if (allowedRoles.length && !allowedRoles.includes(role)) {
      this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
        return false;
      }

      return true;

    } catch (err) {
      this.logger.error('RoleGuard error:', err);
      this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
      return false;
    }
  }
}
