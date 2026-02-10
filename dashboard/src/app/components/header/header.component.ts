import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription, interval } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { NGXLogger } from 'ngx-logger';
import { CommonModule } from '@angular/common';

interface HeaderButton {
  title: string;
  icon?: string;
  routerLink?: string;
  action?: () => void;
  roles?: string[]; // optional roles allowed
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonicModule, CommonModule,RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  userName: string = '';
  userEmail: string = '';
  userRole: string = '';
  pageTitle: string = 'Dashboard';
  currentTime: string = '';

  headerButtons: HeaderButton[] = [];
  filteredHeaderButtons: HeaderButton[] = [];

  private clockSub!: Subscription;
  private routeSub!: Subscription;

  roleLabelMap: Record<string, string> = {
    'proadmin': 'Super Admin',
    'admin': 'Admin',
    'user': 'Executive'
  };

  routeTitleMap: Record<string, string> = {
    '/dashboard': 'Home',
    '/tngc': 'RFID/ABTC',
    '/upload-data': 'Upload Data',
    '/register': 'Register',
    '/update-admin': 'Update Admin',
    '/login': 'Login',
  };

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private logger: NGXLogger
  ) {}

  async ngOnInit() {
    // Get user
    const user = await this.supabaseService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const profile = await this.supabaseService.getProfile(user.id);
    if (profile) {
      this.userName = profile.name || '';
      this.userEmail = profile.email || '';
      this.userRole = profile.role || 'user';
    }

    // Define header buttons
    this.headerButtons = [
      { title: 'Home', routerLink: '/dashboard', roles: ['admin','proadmin','user'] },
      { title: 'RFID/ABTC', routerLink: '/tngc', roles: ['admin','proadmin','user'] },
      { title: 'Upload', routerLink: '/upload-data', roles: ['admin','proadmin'] },
      { title: 'Register', routerLink: '/register', roles: ['proadmin'] },
      { title: 'Logout', action: () => this.logout() } // all roles
    ];

    // Filter buttons according to role
    this.filteredHeaderButtons = this.headerButtons.filter(
      btn => !btn.roles || btn.roles.includes(this.userRole)
    );

    // Update page title on route change
    this.routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.pageTitle = this.routeTitleMap[event.url] || 'Page';
    });

    // Realtime clock
    this.clockSub = interval(1000).subscribe(() => this.updateClock());

  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  get displayRole(): string {
    return this.roleLabelMap[this.userRole] || this.userRole || '';
  }

  private updateClock() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const ss = now.getSeconds().toString().padStart(2,'0');
    this.currentTime = `${hh}:${mm}:${ss}`;
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/login']);
    } catch (err) {
      this.logger.error('Logout failed:', err);
    }
  }
  goToPage(route: string) {
  if (route) {
    this.router.navigate([route]);
  }
}

}
