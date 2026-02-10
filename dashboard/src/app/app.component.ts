import { Component } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { SessionService } from './services/session';
import { SupabaseService } from './services/supabase.service';
import { supabase } from './services/supabaseClient';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule, SideMenuComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private authListener: { subscription: { unsubscribe(): void } } | null = null;
  currentUser = {
    name: '',
    email: '',
    role: ''
  };
  userRole: string = 'user';
  loading: boolean = true;

  constructor(
    private platform: Platform,
    private router: Router,
    private session: SessionService,
    private supabaseService: SupabaseService,
    private logger: NGXLogger
  ) {
    this.logger.debug('AppComponent initialized');
    this.initializeApp();
  }

async initializeApp() {
  await this.platform.ready();

  // unsubscribe listener lama (jika ada)
  if (this.authListener) {
    this.authListener.subscription.unsubscribe();
    this.authListener = null;
  }

  this.authListener = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      if (this.session.isLoggedIn()) {
        this.logger.info('User signed out');
        this.session.logout();
      }
    }
  }).data;

  // session check biasa
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (session?.user) {
      await this.loadUserProfile(session.user.id);
    } else if (this.session.isLoggedIn()) {
      this.userRole = this.session.getRole() || 'user';
    } else {
      this.router.navigate(['/login']);
    }
  } catch (err) {
    this.logger.error('Failed to get Supabase session', err);
  } finally {
    this.loading = false;
  }
}

  private async loadUserProfile(userId: string) {
    try {
      let profile = await this.supabaseService.getProfile(userId);

      if (!profile) {
        this.logger.warn('Profile not found, retrying...', { userId });
        await new Promise(res => setTimeout(res, 1000));
        profile = await this.supabaseService.getProfile(userId);
      }

      if (!profile) {
        this.logger.error('Profile is null, cannot load user', { userId });
        this.userRole = 'user';
        return;
      }

      const role = profile.role?.toLowerCase() || 'user';

      // Start session localStorage
      this.session.startSession(
        { id: userId, name: profile.name || '', email: profile.email || '' },
        role
      );

      // Emit ke SupabaseService supaya SideMenu update
      this.supabaseService.emitUser({
        id: userId,
        email: profile.email || '',
        name: profile.name || '',
        role
      } as any);

      this.userRole = role;
      this.currentUser = {
        name: profile.name || '',
        email: profile.email || '',
        role
      };

      this.logger.debug('Loaded user profile', this.currentUser);

    } catch (err) {
      this.logger.error('Error loading profile', err);
      this.userRole = 'user';
    }
  }

  // Logout manual
  async logout() {
    try {
      await supabase.auth.signOut();
      this.session.logout();
      this.userRole = 'user';
      this.router.navigate(['/login']);
      this.logger.info('User logged out');
    } catch (err) {
      this.logger.error('Logout failed', err);
    }
  }
}
