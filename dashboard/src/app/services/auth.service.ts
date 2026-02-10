import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { SessionService } from './session';
import { NGXLogger } from 'ngx-logger';

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
   * - Ambil user dari Supabase
   * - Ambil profile (role)
   * - Simpan di SessionService
   * - Redirect ke dashboard
   */
    async login(email: string, password: string) {
      try {
        const user = await this.supabaseService.signIn(email, password);

        // ambil profile
        let profile = await this.supabaseService.getProfile(user.id);
        if (!profile) {
          profile = await this.supabaseService.createProfile(user.id, email, 'user');
          if (!profile) {
            alert('Gagal buat profile baru');
            return;
          }
        }

        this.sessionService.startSession(user, profile.role);
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });

      } catch (err: any) {
        this.logger.error('AuthService login error:', err);
        alert(err.message || 'Login gagal');
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
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  /**
   * Cek user login
   */
  async isLoggedIn(): Promise<boolean> {
    // Cek sessionService dulu
    if (this.sessionService.isLoggedIn()) return true;

    // Jika belum ada, cek Supabase
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
