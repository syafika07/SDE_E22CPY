import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { SessionService } from './session';
import { NGXLogger } from 'ngx-logger';
import { ROUTES } from '../routes-map'; // import route mapping constant

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private router: Router,
    private logger : NGXLogger
  ) {}

  /**
   * Login user
   */
  async login(email: string, password: string) {
    try {
      // Login via Supabase
      const user = await this.supabaseService.signIn(email, password);

      // Ambil profile user
      let profile = await this.supabaseService.getProfile(user.id);

      // Jika profile tidak ada, buat baru
      if (!profile) {
        profile = await this.supabaseService.createProfile(user.id, email, 'user');
        if (!profile) {
          alert('Gagal buat profile baru');
          return;
        }
      }

      // Mulai session
      this.sessionService.startSession(user, profile.role);

      // Navigate ke dashboard (pakai obfuscated route)
      await this.router.navigateByUrl(ROUTES.UPLOAD_DATA, { replaceUrl: true });

    } catch (err: any) {
      this.logger.error('AuthService login error:', err);
      alert(err?.message || 'Login gagal');
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.supabaseService.signOut();
    } catch (err) {
      this.logger.error('Supabase logout error:', err);
    }

    this.sessionService.logout();
    await this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
  }

  /**
   * Cek apakah user sudah login
   */
  async isLoggedIn(): Promise<boolean> {
    // Cek sessionService dulu
    if (this.sessionService.isLoggedIn()) return true;

    // Jika belum ada session, cek Supabase
    const user = await this.supabaseService.getUser();
    if (user) {
      const profile = await this.supabaseService.getProfile(user.id);
      this.sessionService.startSession(user, profile?.role || 'user');
      return true;
    }

    return false;
  }

  /**
   * Ambil role user saat ini
   */
  getRole(): string | null {
    return this.sessionService.getRole();
  }

  /**
   * Ambil info user saat ini
   */
  getUser() {
    return this.sessionService.getUser();
  }
}
