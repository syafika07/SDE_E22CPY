import { Injectable, NgZone } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { supabase } from './supabaseClient';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private user: any = null;
  private role: string | null = null;
  private inactivityTimer: any;
  private warningTimer: any;
  private INACTIVITY_LIMIT = 15 * 60 * 1000;
  private WARNING_LIMIT = 3* 60 * 1000;
  private listenersAdded = false;
  private boundResetHandler: () => void;
  private isPaused = false;

  constructor(
    private router: Router,
    private logger: NGXLogger,
    private ngZone: NgZone,
    private alertController: AlertController
  ) {
    this.boundResetHandler = this.resetInactivityTimer.bind(this);
    this.loadFromStorage();
    this.startInactivityWatch();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.resetInactivityTimer();
      }
    });
  }

  startSession(user: any, role: string) {
    this.user = user;
    this.role = role;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);
    this.resetInactivityTimer();
  }

  private loadFromStorage() {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (storedUser) this.user = JSON.parse(storedUser);
    if (storedRole) this.role = storedRole;
  }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  getUser() { return this.user; }
  getRole() { return this.role; }
  hasRole(requiredRole: string): boolean { return this.role === requiredRole; }

  async logout() {
    this.user = null;
    this.role = null;
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.removeInactivityWatch();
    supabase.auth.signOut().catch(() => {});

    setTimeout(() => {
      window.location.replace('/login');
      window.location.reload();
    }, 0);
  }

  startInactivityWatch() {
    if (this.listenersAdded) return;
    this.listenersAdded = true;
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, this.boundResetHandler));
    this.resetInactivityTimer();
  }

  removeInactivityWatch() {
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.removeEventListener(event, this.boundResetHandler));
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    this.listenersAdded = false;
  }

  pauseTimer() {
    this.isPaused = true;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
  }

  resumeTimer() {
    this.isPaused = false;
    this.resetInactivityTimer();
  }

  private resetInactivityTimer() {
    if (this.isPaused) return;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = setTimeout(() => {
        this.ngZone.run(() => this.showLogoutWarning());
      }, this.INACTIVITY_LIMIT);
    });
  }

  private async showLogoutWarning() {
    const alert = await this.alertController.create({
      header: 'Session Timeout',
      message: 'You still want to continue?',
      buttons: [
        { text: 'Yes', handler: () => this.resetInactivityTimer() },
        { text: 'No', handler: () => this.logout() }
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
