import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { supabase } from './supabaseClient';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ROUTES } from '../routes-map';

@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnDestroy {
  private user: any = null;
  private role: string | null = null;

  private inactivityTimer: any;
  private warningTimer: any;

  private readonly INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 jam*
  private readonly WARNING_LIMIT = 15 * 60 * 1000;      // 15 minutes *

  private boundResetHandler: () => void;
  private listenersAdded = false;
  private isPaused = false;

  private routerSub: Subscription;

  constructor(
    private router: Router,
    private logger: NGXLogger,
    private ngZone: NgZone,
    private alertController: AlertController
  ) {
    this.boundResetHandler = this.resetInactivityTimer.bind(this);
    this.loadFromStorage();

    // Auto start timer kalau ada user
    if (this.isLoggedIn()) this.startInactivityWatch();

    // Pantau route changes
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {

        const cleanUrl = event.url.replace(/^\//, '');

        // 🚫 KECUALI LOGIN & TV DISPLAY
        if (cleanUrl === ROUTES.LOGIN || cleanUrl === ROUTES.TV_DISPLAY || cleanUrl === ROUTES.REPORT || cleanUrl === ROUTES.REPORT_COLLECTION) {
          this.pauseTimer();
        } else if (this.isLoggedIn()) {
          this.resumeTimer();
        }

        this.resetInactivityTimer();
      }
    });

    // Cross-tab logout detection
    window.addEventListener('storage', (event) => {
      if (event.key === 'user' && !event.newValue) {
        this.logger.info('Detected logout from another tab');
        this.pauseTimer();
      }
    });
  }

  ngOnDestroy() {
    this.removeInactivityWatch();
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  // ------------------ Public API ------------------

  startSession(user: any, role: string) {
    this.user = user;
    this.role = role;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);

    this.isPaused = false;
    this.startInactivityWatch();
    this.resetInactivityTimer();
  }

  async logout() {
    this.user = null;
    this.role = null;
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    this.pauseTimer();
    this.removeInactivityWatch();

    await supabase.auth.signOut().catch(err => {
      this.logger.error('Supabase signOut failed', err);
    });

    setTimeout(() => {
      window.location.replace(ROUTES.LOGIN);
      window.location.reload();
    }, 0);
  }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  getUser() { return this.user; }
  getRole() { return this.role; }
  hasRole(role: string) { return this.role === role; }

  pauseTimer() {
    this.isPaused = true;
    this.clearTimers();
  }

  resumeTimer() {
    if (!this.isLoggedIn()) return;
    this.isPaused = false;
    this.resetInactivityTimer();
  }

  // ------------------ Private helpers ------------------

  private loadFromStorage() {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (storedUser) this.user = JSON.parse(storedUser);
    if (storedRole) this.role = storedRole;
  }

  private startInactivityWatch() {
    if (this.listenersAdded) return;
    this.listenersAdded = true;

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt =>
      document.addEventListener(evt, this.boundResetHandler)
    );
  }

  private removeInactivityWatch() {
    if (!this.listenersAdded) return;

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt =>
      document.removeEventListener(evt, this.boundResetHandler)
    );

    this.listenersAdded = false;
    this.clearTimers();
  }

  private clearTimers() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
  }

  private resetInactivityTimer() {
    if (this.isPaused || !this.isLoggedIn()) return;

    this.clearTimers();

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = setTimeout(() => {
        this.ngZone.run(() => this.showLogoutWarning());
      }, this.INACTIVITY_LIMIT);
    });
  }

  private async showLogoutWarning() {
    if (!this.isLoggedIn()) return;

    // 🚫 JANGAN logout / warning di TV DISPLAY
    const currentUrl = this.router.url.replace(/^\//, '');
      if (currentUrl === ROUTES.TV_DISPLAY || currentUrl === ROUTES.LOGIN || currentUrl === ROUTES.REPORT || currentUrl === ROUTES.REPORT_COLLECTION) {
      this.pauseTimer();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Sesi Tamat / Session Timeout',
      cssClass: 'custom-session-alert',
      message: 'Anda akan log keluar secara automatik kerana tidak aktif. Teruskan sesi anda?' ,

      buttons: [
        { text: 'Ya / Yes', handler: () => this.resetInactivityTimer() },
        { text: 'Logout', handler: () => this.logout() }
      ],
      backdropDismiss: false
    });



    await alert.present();

    this.warningTimer = setTimeout(async () => {
      const isAlertOpen = document.querySelector('ion-alert') !== null;
      if (isAlertOpen) {
        await alert.dismiss();
        this.logout();
      }
    }, this.WARNING_LIMIT);
  }
}
