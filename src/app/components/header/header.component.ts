import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { NGXLogger } from 'ngx-logger';
import { SessionService } from 'src/app/services/session';

import {
  IonHeader,
  IonToolbar,
  IonMenuButton,
  IonButtons,
  IonButton
} from '@ionic/angular/standalone';
import { ROUTES } from 'src/app/routes-map';
import { ActiveRouteService } from 'src/app/services/header-active.service';

interface HeaderButton {
  title: string;
  routerLink?: string;
  action?: () => void;
  roles?: string[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonMenuButton,
    IonButtons,
    IonButton,

],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  userName = '';
  userRole = '';
  currentTime = '';

  headerButtons: HeaderButton[] = [];
  filteredHeaderButtons: HeaderButton[] = [];

  private clockSub?: Subscription;

  roleLabelMap: Record<string, string> = {
    proadmin: 'Super Admin',
    admin: 'Admin',
    user: 'Operator'
  };

  // Full route → title mapping
  routeTitleMap: Record<string, string> = {
    //[ROUTES.DASHBOARD]: 'Summary Report',
    [ROUTES.REPORT]: 'Daily Report',
    [ROUTES.TNG]: 'TNG',
    [ROUTES.TNGC]: 'Dashboard',
    [ROUTES.UPLOAD_DATA]: 'Upload Data',
    [ROUTES.REGISTER]: 'Register',
    [ROUTES.UPDATE_ADMIN]: 'Update Admin',
    [ROUTES.PROFILE]: 'Profile'

  };

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private logger: NGXLogger,
    private activeRouteService: ActiveRouteService,
    private session: SessionService

  ) {}

  async ngOnInit() {
    // Load user
    const user = await this.supabaseService.getUser();
    if (!user) {
      this.router.navigateByUrl(ROUTES.LOGIN);
      return;
    }

    const profile = await this.supabaseService.getProfile(user.id);
    if (profile) {
      this.userName = profile.name || '';
      this.userRole = profile.role || 'user';
    }

    // Define header buttons
    this.headerButtons = [
      //{ title: 'Summary', routerLink: ROUTES.DASHBOARD, roles: ['admin','proadmin','user'] },
      { title: 'Daily Report', routerLink: ROUTES.REPORT},
      { title: 'Dashboard', routerLink: ROUTES.TNGC, roles: ['admin','proadmin'] },
      { title: 'Upload Data', routerLink: ROUTES.UPLOAD_DATA, roles: ['user','admin','proadmin'] },
    ];

    // Filter buttons by role
    this.filteredHeaderButtons = this.headerButtons.filter(
      btn => !btn.roles || btn.roles.includes(this.userRole)
    );

    // Start clock
    this.clockSub = interval(1000).subscribe(() => this.updateClock());
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
  }

  get displayRole(): string {
    return this.roleLabelMap[this.userRole] || this.userRole || '';
  }

  // Getter to get current page title based on route
  get currentTitle(): string {
    const url = this.router.url.split('?')[0].replace(/\/$/, '');
    const matchedRoute = Object.keys(this.routeTitleMap)
      .find(routePath => url.endsWith(routePath.replace(/^\//, '')));
    return matchedRoute ? this.routeTitleMap[matchedRoute] : 'Page';
  }

  private updateClock() {
    const now = new Date();
    this.currentTime =
      now.getHours().toString().padStart(2,'0') + ':' +
      now.getMinutes().toString().padStart(2,'0') + ':' +
      now.getSeconds().toString().padStart(2,'0');
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.router.navigateByUrl(ROUTES.LOGIN);
      this.activeRouteService.setActiveRoute('');
    } catch (err) {
      this.logger.error('Logout failed:', err);
    }
  }

  goToPage(route?: string) {
    if (route) {
      this.router.navigateByUrl(route);
      this.activeRouteService.setActiveRoute(route); // ✅ update active route

    }
  }
isActive(route?: string): boolean {
  if (!route) return false;
  return this.activeRouteService.getCurrentRoute() === route;
}
// Function to capitalize each word
get formattedUserName(): string {
  if (!this.userName) return '';
  return this.userName
    .toLowerCase() // semua huruf lowercase dulu
    .split(' ')    // pisahkan ikut space
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

get showHeader(): boolean {
  // Guna isAuthenticated() bukan isLoggedIn()
  return this.session.isAuthenticated();
}

}
