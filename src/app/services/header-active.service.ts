import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActiveRouteService {
  private activeRouteSubject = new BehaviorSubject<string>(window.location.pathname);

  // expose sebagai Observable untuk subscribe
  activeRoute$ = this.activeRouteSubject.asObservable();

  setActiveRoute(route: string) {
    this.activeRouteSubject.next(route);
  }

  // getter untuk akses current value
  getCurrentRoute(): string {
    return this.activeRouteSubject.getValue();
  }
}
