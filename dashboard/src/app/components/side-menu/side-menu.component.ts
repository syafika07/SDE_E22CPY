import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { IonicModule, IonMenu } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Subscription, interval } from 'rxjs';
import { SessionService } from 'src/app/services/session';
import { NGXLogger } from 'ngx-logger';

interface MenuItem {
  title: string;
  icon: string;
  url: string;
  roles?: string[];
}

interface User {
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements OnInit, OnDestroy {
  @ViewChild(IonMenu) menu!: IonMenu;

  user: User = { name: '', email: '', role: '' };
  activeUrl: string = window.location.pathname;
  filteredMenuItems: MenuItem[] = [];
  private sub!: Subscription;

  // clock
  currentTime: string = '';
  private clockSub!: Subscription;

  roleLabelMap: Record<string, string> = {
    proadmin: 'Super Admin',
    admin: 'Admin',
    user: 'Executive',
  };

  menuItems: MenuItem[] = [
    { title: 'Home', icon: 'home-outline', url: '/dashboard', roles: ['admin', 'proadmin', 'user'] },
    { title: 'TNG Data', icon: 'cloud-upload-outline', url: '/tng', roles: ['admin', 'proadmin', 'user'] },
    { title: 'RFID/ABTC', icon: 'cloud-upload-outline', url: '/tngc', roles: ['admin', 'proadmin', 'user'] },
    { title: 'Upload Data', icon: 'cloud-upload-outline', url: '/upload-data', roles: ['admin', 'proadmin'] },
    { title: 'Register', icon: 'cloud-upload-outline', url: '/register', roles: ['proadmin'] },
    { title: 'Update Admin', icon: 'cloud-upload-outline', url: '/update-admin', roles: ['proadmin'] },
    { title: 'Logout', icon: 'log-out-outline', url: '/login' },
  ];

  constructor(
    private supabaseService: SupabaseService,
    private session: SessionService,
    private logger: NGXLogger
  ) {
    this.logger.debug('SideMenuComponent initialized');
  }

  ngOnInit() {
    this.sub = this.supabaseService.user$.subscribe(async (supabaseUser) => {
      if (supabaseUser) {
        const profile = await this.supabaseService.getProfile(supabaseUser.id);
        this.user = {
          name: profile?.name || '',
          email: profile?.email || '',
          role: profile?.role || 'user',
        };
      } else {
        this.user = { name: '', email: '', role: '' };
      }

      this.filteredMenuItems = this.menuItems.filter((item) => !item.roles || item.roles.includes(this.user.role));
    });

    this.updateTime();
    this.clockSub = interval(1000).subscribe(() => this.updateTime());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.clockSub?.unsubscribe();
  }

  get displayRole(): string {
    return this.roleLabelMap[this.user.role] || this.user.role || 'User';
  }

  setActive(url: string) {
    this.activeUrl = url;
    this.menu?.close();
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.session.logout();
    } catch (err) {
      this.logger.error('Logout failed:', err);
    }
  }

  private updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hh = hours < 10 ? '0' + hours : hours;
    const mm = minutes < 10 ? '0' + minutes : minutes;
    const ss = seconds < 10 ? '0' + seconds : seconds;
    this.currentTime = `${hh}:${mm}:${ss} ${ampm}`;
  }
}
