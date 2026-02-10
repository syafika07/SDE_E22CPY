import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';

import { filter } from 'rxjs';
import { ROUTES } from 'src/app/routes-map';
import { SupabaseService } from '../../services/supabase.service';
import { NGXLogger } from 'ngx-logger';
import { ActiveRouteService } from 'src/app/services/header-active.service';
import { TvDisplayPage } from 'src/app/pages/tv-display/tv-display.page';



@Component({
  selector: 'app-header2',
  templateUrl: './header2.component.html',
  standalone: true,
  imports: [IonicModule],
  styleUrls: ['./header2.component.scss'],
})
export class Header2Component implements OnInit {


  ROUTES = ROUTES; // ✅ supaya boleh guna dalam HTML
  activeRoute: string = ROUTES.TV_DISPLAY; // fallback default

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private logger: NGXLogger,
    private activeRouteService: ActiveRouteService

  ) {}

  ngOnInit() {
    this.updateActiveRoute(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRoute(event.urlAfterRedirects || event.url);
      });
  }

  private updateActiveRoute(url: string): void {
    // buang ?query, #fragment & slash depan
    const cleanUrl = url
      .split('?')[0]
      .split('#')[0]
      .replace(/^\//, '')
      .replace(/\/$/, '');

    // padankan dengan ROUTES
    const matchedRoute = Object.values(ROUTES).find(r =>
      cleanUrl.endsWith(r)
    );

    this.activeRoute = matchedRoute || ROUTES.TV_DISPLAY;
  }

async setActiveAndNavigate(route: string): Promise<void> {
  if (this.activeRoute === route) return;

  // Cari instance TvDisplayPage di DOM
  const tvPageEl = document.querySelector('app-tv-display') as any;
  if (tvPageEl && typeof tvPageEl.cleanupBeforeExit === 'function') {
    tvPageEl.cleanupBeforeExit();
  }

  const header = document.querySelector('ion-header');
  header?.classList.add('route-changing');

  setTimeout(() => {
    this.activeRoute = route;

    this.router.navigateByUrl(route).finally(() => {
      setTimeout(() => {
        header?.classList.remove('route-changing');
      }, 120);
    });
  }, 60);
}

async logout() {
  try {
    // 🔹 Hentikan semua fungsi TV_DISPLAY dulu jika sedang di page itu
    if (this.activeRoute === ROUTES.TV_DISPLAY) {
      const tvDisplayComp = document.querySelector('app-tv-display') as any;
      if (tvDisplayComp?.cleanupBeforeExit) {
        tvDisplayComp.cleanupBeforeExit();
      }
    }

    await this.supabaseService.signOut();
    this.router.navigateByUrl(ROUTES.LOGIN);
    this.activeRouteService.setActiveRoute('');
  } catch (err) {
    this.logger.error('Logout failed:', err);
  }
}
}
