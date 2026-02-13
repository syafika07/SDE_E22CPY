import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SupabaseService } from '../../services/supabase.service';
import { Subscription, interval } from 'rxjs';
import { SessionService } from 'src/app/services/session';
import { NGXLogger } from 'ngx-logger';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { ROUTES } from 'src/app/routes-map';
import { ActiveRouteService } from 'src/app/services/header-active.service';


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
  imports: [
    IonMenu,
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonLabel,
    RouterModule
],
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
    user: 'Operator'
  };
  canSwipe: boolean = true; // default true
  excludedRoutes = [ROUTES.LOGIN, ROUTES.RESET_PASS, ROUTES.CHANGES, ROUTES.REPORT, ROUTES.REPORT_COLLECTION]; // routes tak nak swipe


menuItems: MenuItem[] = [
  //{ title: 'Summary Report', icon: 'home-outline', url: ROUTES.DASHBOARD, roles: ['admin', 'proadmin', 'user'] },
  { title: 'Daily Report (Veh)', icon: 'document-text-outline', url: ROUTES.REPORT,roles: ['user','admin', 'proadmin']},
  { title: 'Daily Report (RM)', icon: 'document-text-outline', url: ROUTES.REPORT_COLLECTION,roles: ['user','admin', 'proadmin']},
  { title: 'TNG Data', icon: 'cloud-upload-outline', url: ROUTES.TNG, roles: ['proadmin'] },
  { title: 'Dashboard', icon: 'cloud-upload-outline', url: ROUTES.TNGC, roles: ['admin', 'proadmin'] },
  { title: 'Upload Data', icon: 'cloud-upload-outline', url: ROUTES.UPLOAD_DATA, roles: ['user','admin', 'proadmin'] },
  { title: 'Register', icon: 'cloud-upload-outline', url: ROUTES.REGISTER, roles: ['proadmin'] },
  { title: 'Update Admin', icon: 'cloud-upload-outline', url: ROUTES.UPDATE_ADMIN, roles: ['proadmin'] },
  { title: 'Profile', icon: 'cloud-upload-outline', url: ROUTES.PROFILE, roles: ['admin', 'proadmin', 'user','editor'] },
  { title: 'Logout', icon: 'log-out-outline', url: ROUTES.LOGIN },
  { title: 'Daily Report (testing mode)', icon: 'document-text-outline', url: ROUTES.REPORT, roles: ['proadmin']},
];

  constructor(
    private supabaseService: SupabaseService,
    private session: SessionService,
    private logger: NGXLogger,
    private activeRouteService: ActiveRouteService

  ) {
    this.logger.debug('SideMenuComponent initialized');
  }

  ngOnInit() {
        this.activeRouteService.activeRoute$.subscribe(route => {
      this.activeUrl = route;
      // disable swipe untuk login / reset password
      this.canSwipe = !this.excludedRoutes.includes(route);
    });

    this.activeRouteService.activeRoute$.subscribe(route => {
    this.activeUrl = route;
    });
    // 🔹 Subscribe ke reactive user state
    this.sub = this.supabaseService.user$.subscribe(async (supabaseUser) => {
      if (supabaseUser) {
        const profile = await this.supabaseService.getProfile(supabaseUser.id);
        this.user = {
          name: profile?.name ? this.capitalizeWords(profile.name) : '',
          email: profile?.email || '',
          role: profile?.role || 'user',
        };
      } else {
        this.user = { name: '', email: '', role: 'user' };
      }

      // Update menu items ikut role
      this.filteredMenuItems = this.menuItems.filter((item) => !item.roles || item.roles.includes(this.user.role));
    });

    // 🔹 Initialize realtime clock
    this.updateTime(); // initial
    this.clockSub = interval(1000).subscribe(() => this.updateTime());

  }


  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.clockSub?.unsubscribe();
  }

  get displayRole(): string {
    return this.roleLabelMap[this.user.role] || this.user.role || 'User';
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.session.logout();
      this.activeRouteService.setActiveRoute('');

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
  setActive(url: string) {
  this.activeRouteService.setActiveRoute(url);
  this.menu?.close();
}
private capitalizeWords(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
get displayName(): string {
  return this.capitalizeWords(this.user.name);
}

}
