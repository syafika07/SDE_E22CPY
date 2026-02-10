import { Component, OnInit, ElementRef, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { SupabaseService, Announcement } from 'src/app/services/supabase.service';
import { Header2Component } from 'src/app/components/header2/header2.component';
import { IonContent } from '@ionic/angular/standalone';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-tv-display',
  templateUrl: './tv-display.page.html',
  styleUrls: ['./tv-display.page.scss'],
  standalone: true,
  imports: [Header2Component, IonContent],
  providers: [SupabaseService]
})
export class TvDisplayPage implements OnInit, OnDestroy {
  currentTime = '';
  currentDayName = '';
  currentDateFormatted = '';

  @ViewChild('fullscreenTarget', { static: true }) fullscreenTarget!: ElementRef;
  @ViewChild(IonContent, { static: false }) ionContent!: IonContent;
  @ViewChild('tvContent', { static: false })
  tvContent!: IonContent;

  list: Announcement[] = [];
  days: Date[] = [];
  currentDayIndex = 0;

  countdown = 0;
  timerSubscription!: Subscription;

  isFullscreen = false;
  controlsVisible = true;
  hideControlsTimer: any;

  // Hebahan
  hebahanList: Announcement[] = [];
  hebahanIndex: number = 0;

  // Auto scroll
  private scrollInterval: any;
  private isScrolling = false;
  private holdTimer: any;
  private scrollAnimationFrame: number | null = null;

  private loadAnnouncementsInterval: any;
  private checkNewDayInterval: any;
  private dateTimeInterval: any;
  private check6amInterval: any;
  private isAutoFlowActive = false;

  private isTransitioning = false;

  constructor(
    private supabase: SupabaseService,
    private sanitizer: DomSanitizer,
    private logger: NGXLogger
  ) {}

ngOnInit() {
  this.generateDays();

this.loadAnnouncements(true); // sentiasa fetch freshloadAnnouncements
  this.startHideControlsTimer();
  this.startDateTimeTimer();

  this.loadAnnouncementsInterval = setInterval(() => {
    if (navigator.onLine && this.isAutoFlowActive && !this.isTransitioning && !this.isScrolling) {
      this.loadAnnouncements();
    }
  }, 60000);


    // Sync flag dengan DOM bila user tekan Esc
  document.addEventListener('fullscreenchange', () => {
    const elem = this.fullscreenTarget.nativeElement;
    this.isFullscreen = !!document.fullscreenElement;

    if (this.isFullscreen) {
      elem.classList.add('fullscreen');
    } else {
      elem.classList.remove('fullscreen', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday');
      this.updateFullscreenClass();
    }
  });
}


  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
    this.stopAutoScroll();
    clearTimeout(this.hideControlsTimer);
    clearTimeout(this.holdTimer);
    clearInterval(this.loadAnnouncementsInterval);
    clearInterval(this.checkNewDayInterval);
    clearInterval(this.dateTimeInterval);
    clearInterval(this.check6amInterval);
  }

  private getNext6amTimestamp(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    const today6am = new Date(year, month, date, 6, 0, 0, 0).getTime();
    const tomorrow6am = new Date(year, month, date + 1, 6, 0, 0, 0).getTime();

    return now.getTime() >= today6am ? tomorrow6am : today6am;
  }

  private logNext6am() {
    const next6am = new Date(this.getNext6amTimestamp());
    this.logger.debug(`[6am Refresh] Next scheduled at:`, next6am.toLocaleString('ms-MY'));
  }


async loadAnnouncements(forceFetch = true) {
  const isOnline = navigator.onLine;

  if (!isOnline) {
    this.logger.warn('Offline — cannot fetch announcements');
    this.list = [];
    if (!this.isScrolling) this.resetDay();
    return;
  }

  try {
    const res: any[] = await this.supabase.getAnnouncements();
    this.list = this.normalizeAnnouncements(res);
    this.logger.info('✅ Announcements loaded (from Supabase)');
  } catch (err) {
    this.logger.error('❌ Failed to load announcements', err);
    this.list = [];
  }

  if (!this.isScrolling) this.resetDay();
}

private normalizeAnnouncements(res: any[]): Announcement[] {
  return (res || []).map(ann => {
    const typeValue = ann.type || ann.ann_type || 'Hebahan';
    const datetimeValue = Array.isArray(ann.datetime)
      ? ann.datetime[0]
      : (ann.datetime || '');
    return {
      ...ann,
      ann_type: typeValue as 'Cuti' | 'Hebahan' | 'Meeting',
      datetime: datetimeValue
    };
  });
}


  getAnnouncementsByType(day: Date, type: 'Cuti' | 'Hebahan' | 'Meeting'): Announcement[] {
    const dayKey = this.getLocalDateString(day);
    return this.list.filter(a => {
      if (!a.datetime) return false;
      const announcementDate = new Date(a.datetime);
      const dtKey = this.getLocalDateString(announcementDate);
      return a.ann_type === type && dtKey === dayKey;
    });
  }

private getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  trackByAnnouncementId(index: number, announcement: Announcement): any {
    return announcement.id || announcement.title || index;
  }

  getSafeHtml(html?: string): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  formatDateTime(dt?: string) {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleString('ms-MY', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date?: Date) {
    if (!date) return '';
    return date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  generateDays() {
    this.days = [];
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate();

    const todayUTC = Date.UTC(year, month, date);
    const dayOfWeek = new Date(todayUTC).getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? -6 : (1 - dayOfWeek);

    const mondayUTC = todayUTC + daysUntilMonday * 24 * 60 * 60 * 1000;

    for (let i = 0; i < 5; i++) {
      const dayUTC = mondayUTC + i * 24 * 60 * 60 * 1000;
      this.days.push(new Date(dayUTC));
    }

    this.logger.log('[generateDays] UTC-based:', this.days.map(d => d.toISOString().split('T')[0]));
  }

  startSlideTimer() {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = timer(0, 1000).subscribe(() => {
      if (this.countdown > 0 && !this.isScrolling && !this.isTransitioning) {
        this.countdown--;
        if (this.countdown <= 0) {
          // Selepas hold 5s → next frame/day
          const day = this.days[this.currentDayIndex];
          const cuti = this.getAnnouncementsByType(day, 'Cuti');
          const meeting = this.getAnnouncementsByType(day, 'Meeting');
          const hebahan = this.hebahanList;

          if (this.hebahanIndex + 1 < hebahan.length) {
            this.displayFrame(cuti, meeting, hebahan, this.hebahanIndex + 1);
          } else {
            this.changeDay('next');
          }
        }
      }
    });
  }

async resetDay() {


  this.logger.log(`[resetDay] Start for day index ${this.currentDayIndex}`);

  // Matikan flow lama
  this.isAutoFlowActive = false;
  this.stopAllScroll();
  this.timerSubscription?.unsubscribe();

  // Reset scroll ke atas
  await this.scrollToTop();
  await new Promise(r => setTimeout(r, 80)); // bagi DOM stabilize sikit

  const day = this.days[this.currentDayIndex];
  if (!day) {
    this.logger.warn('[resetDay] Day undefined — fallback to next');
    setTimeout(() => this.changeDay('next'), 500);
    return;
  }

  // Ambil data ikut hari
  const cutiList = this.getAnnouncementsByType(day, 'Cuti');
  const meetingList = this.getAnnouncementsByType(day, 'Meeting');
  const hebahanList = this.getAnnouncementsByType(day, 'Hebahan');

  this.hebahanList = hebahanList;
  this.hebahanIndex = 0;

  // 🚨 KES KRITIKAL: hari kosong
  if (
    cutiList.length === 0 &&
    meetingList.length === 0 &&
    hebahanList.length === 0
  ) {
    this.logger.log(`[resetDay] Hari ${this.currentDayIndex}: Tiada data — auto skip`);

    // Tunggu 3s supaya user nampak hari bertukar
    setTimeout(() => {
      if (!this.isTransitioning) {
        this.changeDay('next');
      }
    }, 3000);

    this.isTransitioning = false; // ✅ reset flag supaya boleh change day seterusnya

    return;
  }

  // ✅ Ada data → hidupkan auto-flow
  this.isAutoFlowActive = true;

  // Mulakan frame pertama
  await this.displayFrame(cutiList, meetingList, hebahanList, 0);

  this.logger.log(`[resetDay] Day ${this.currentDayIndex} started`);
}

  private async displayFrame(
    cuti: Announcement[],
    meeting: Announcement[],
    hebahan: Announcement[],
    index: number
  ): Promise<void> {
    if (!this.isAutoFlowActive || this.isTransitioning) return;

    // Hentikan scroll sebelum tukar hebahan
    this.stopAllScroll();

    this.hebahanIndex = index;
    await this.scrollToTop();
    await new Promise(r => setTimeout(r, 200));

    // Ukur tinggi frame ni
    const frameHeight = await this.measureFrameHeight();
    const viewportHeight = (window as any).screen.height;

    this.logger.log(`[Frame] Hebahan #${index + 1}/${hebahan.length || 1}, Height: ${frameHeight}px, Viewport: ${viewportHeight}px`);

    if (frameHeight > viewportHeight) {
      // Scroll required
      await this.performScrollForFrame(frameHeight, viewportHeight);
    } else {
      // Hold 5s then next frame/day
      this.countdown = 5;
      this.startSlideTimer();
    }
  }
private async measureFrameHeight(): Promise<number> {
  if (!this.ionContent) return 0;

  // Ambil scroll container sebenar ion-content
  const scrollEl = await this.ionContent.getScrollElement();

  // Tinggi sebenar content (SEMUA section)
  const contentHeight = scrollEl.scrollHeight;

  // Tinggi viewport ion-content
  const viewportHeight = scrollEl.clientHeight;

  this.logger.log(
    `[Measure] contentHeight=${contentHeight}, viewportHeight=${viewportHeight}`
  );

  return contentHeight;
}


  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

private async performScrollForFrame(frameHeight: number, viewportHeight: number): Promise<void> {
  if (!this.isAutoFlowActive) return;

  let scrollableHeight = frameHeight + viewportHeight; // 1853 - 920 = 933
  if (scrollableHeight <= 0) {
    // Frame muat dalam screen → hold 5s
    this.countdown = 5;
    this.startSlideTimer();
    return;
  }

  // 1px = 0.1s → 100ms per pixel
  let durationMs = scrollableHeight * 15;

  // Optional clamp: min 5s, max 2 min (120000ms)
  durationMs = Math.min(120000, Math.max(5000, durationMs));

  this.logger.log(`[Scroll] ScrollableHeight: ${scrollableHeight}px, Duration: ${durationMs / 1000}s`);

  this.isScrolling = true;
  this.countdown = 0;

  try {
    // ✅ Hold 4 saat sebelum mula scroll
    this.logger.log(`[Scroll] Hold 4 saat sebelum scroll`);
    await new Promise(r => setTimeout(r, 2000));

    await this.performSmoothScroll(scrollableHeight, durationMs);
    this.logger.log(`[Scroll] Berjaya selesai`);

    this.logger.log(`[Scroll] Hold 4 saat selepas scroll`);
    await new Promise(r => setTimeout(r, 2000));

  } catch (err) {
    this.logger.warn('[Scroll] Cancelled or failed', err);
  } finally {
    this.isScrolling = false;
    this.countdown = 0;

    if (this.isAutoFlowActive) {
      if (this.hebahanIndex + 1 < this.hebahanList.length) {
        setTimeout(() => {
          if (this.isAutoFlowActive && !this.isScrolling) {
            const day = this.days[this.currentDayIndex];
            this.displayFrame(
              this.getAnnouncementsByType(day, 'Cuti'),
              this.getAnnouncementsByType(day, 'Meeting'),
              this.hebahanList,
              this.hebahanIndex + 1
            );
          }
        }, 100);
      } else {
        this.changeDay('next');
      }
    }
  }
}


    private getEstimatedLineHeight(): number {
      const container = document.querySelector('.announcement-container') as HTMLElement;
      if (!container) return 32;

      // Ambil elemen teks dalam hebahan
      const hebahanDesc = document.querySelector('.ann-hebahan .ann-desc') as HTMLElement;
      if (hebahanDesc) {
        const firstChild = hebahanDesc.firstElementChild || hebahanDesc;
        const style = getComputedStyle(firstChild);
        const lineHeight = parseFloat(style.lineHeight);
        if (!isNaN(lineHeight)) return lineHeight;
      }

      // Fallback: ukur dari dummy elemen
      const dummy = document.createElement('div');
      dummy.style.position = 'absolute';
      dummy.style.visibility = 'hidden';
      dummy.style.font = getComputedStyle(container).font;
      dummy.style.padding = '0';
      dummy.style.margin = '0';
      dummy.style.lineHeight = 'normal';
      dummy.innerHTML = 'A'; // satu baris teks

      document.body.appendChild(dummy);
      const height = dummy.offsetHeight;
      document.body.removeChild(dummy);

      return height || 32;
    }

private performSmoothScroll(scrollableHeight: number, durationMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const scroll = () => {
      if (this.isTransitioning) {
        reject('Scroll cancelled due to transition');
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Easing function (ease-in-out)
      //const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);

      const scrollPosition = scrollableHeight * progress;

      if (this.ionContent) {
        this.ionContent.scrollToPoint(0, scrollPosition, 0);
      }

      if (progress < 1) {
        this.scrollAnimationFrame = requestAnimationFrame(scroll);
      } else {
        this.scrollAnimationFrame = null;
        resolve();
      }
    };

    this.scrollAnimationFrame = requestAnimationFrame(scroll);
  });
}


  private stopAutoScroll() {
    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
    this.isScrolling = false;
    this.countdown = 0;
  }

  private async nextHebahanOrDay() {
    // Tidak digunakan — gantikan dengan `displayFrame` flow
  }

  private async scrollToTop() {
    if (!this.tvContent) return;
    await this.tvContent.scrollToTop(300);
  }



 async prevDay() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.currentDayIndex = (this.currentDayIndex - 1 + this.days.length) % this.days.length;
    this.logger.log(`[prevDay] → ${this.currentDayIndex}`);
    this.resetDay();
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  pauseSlide() {
    this.isAutoFlowActive = false;
    this.timerSubscription?.unsubscribe();
    this.stopAutoScroll();
  }

  resumeSlide() {
    this.isAutoFlowActive = true;
    this.startSlideTimer();
    setTimeout(() => {
      if (!this.isTransitioning) {
        const day = this.days[this.currentDayIndex];
        const cuti = this.getAnnouncementsByType(day, 'Cuti');
        const meeting = this.getAnnouncementsByType(day, 'Meeting');
        const hebahan = this.hebahanList;
        if (this.hebahanList.length > 0) {
          this.displayFrame(cuti, meeting, hebahan, this.hebahanIndex);
        }
      }
    }, 100);
  }

  checkNewDay() {
    if (this.isAutoFlowActive) return;
    if (this.isTransitioning || this.isScrolling) return;

    try {
      const now = new Date();
      const todayStr = this.getLocalDateString(now);
      const currentDay = this.days[this.currentDayIndex];
      if (!currentDay) return;

      const currentDayStr = this.getLocalDateString(currentDay);

      if (todayStr === currentDayStr) return;

      const newDayIndex = this.days.findIndex(day =>
        this.getLocalDateString(day) === todayStr
      );

      if (newDayIndex !== -1 && newDayIndex !== this.currentDayIndex) {
        this.logger.log(
          `[checkNewDay] Hari berubah: ${this.currentDayIndex} → ${newDayIndex} | ${todayStr}`
        );
        this.currentDayIndex = newDayIndex;
        this.resetDay();
      }
    } catch (err) {
      this.logger.error('[checkNewDay] Error:', err);
    }
  }
  // Tambah function di dalam TvDisplayPage
  private async resetScrollPosition(): Promise<void> {
    this.logger.log('[Scroll] Reset scroll ke atas');
    this.stopAllScroll(); // hentikan scroll sedia ada
    if (this.tvContent) {
      await this.tvContent.scrollToTop(300); // smooth scroll 300ms
    }
    this.countdown = 0; // reset countdown slide
  }


  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key) && this.isTransitioning) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Escape' && this.isFullscreen) {
      this.toggleFullscreen();
      event.preventDefault();
    } else if (event.key.toLowerCase() === 'f') {
      this.toggleFullscreen();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.changeDay('prev');
      this.resetScrollPosition();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.changeDay('next');
      this.resetScrollPosition()
    } else if (event.key === ' ') {
      event.preventDefault();
      if (this.timerSubscription && !this.timerSubscription.closed) {
        this.pauseSlide();
      } else {
        this.resumeSlide();
      }
    }

    this.showControls();
  }

  @HostListener('document:mousemove')
  @HostListener('document:touchstart')
  showControls() {
    this.controlsVisible = true;
    this.startHideControlsTimer();
  }

  startHideControlsTimer() {
    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      this.controlsVisible = false;
    }, 3000);
  }

  private updateDateTime() {
    const now = new Date();
    const daysMY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    this.currentDayName = daysMY[now.getDay()];

    const pad = (n: number) => n.toString().padStart(2, '0');
    this.currentDateFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    this.currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  private startDateTimeTimer() {
    this.updateDateTime();
    this.dateTimeInterval = setInterval(() => this.updateDateTime(), 1000);
  }

toggleFullscreen() {
  const elem = this.fullscreenTarget.nativeElement;

  if (!this.isFullscreen) {
    // Masuk fullscreen
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err: any) => this.logger.warn('Failed to enter fullscreen', err));
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    }

    // Add class
    elem.classList.add('fullscreen');
    this.updateFullscreenClass();
  } else {
    // Keluar fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => this.logger.warn('Failed to exit fullscreen', err));
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }

    // Remove class
    elem.classList.remove('fullscreen', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday');
  }
}


  updateFullscreenClass() {
    const elem = this.fullscreenTarget.nativeElement;
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    elem.classList.remove(...dayNames);

    if (this.currentDayIndex >= 0 && this.currentDayIndex < dayNames.length) {
      const newClass = dayNames[this.currentDayIndex];
      elem.classList.add(newClass);
      this.logger.log(`[CSS] Updated class: ${newClass}`);
    }
  }

  private stopAllScroll() {
    // Stop page auto scroll
    this.stopAutoScroll();

    // Stop hebahan animation frame
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
  }

  getAnnouncementsForDay(day: Date): Announcement[] {
    const types: ('Cuti' | 'Hebahan' | 'Meeting')[] = ['Meeting', 'Cuti', 'Hebahan'];
    let all: Announcement[] = [];
    for (const type of types) {
      all = all.concat(this.getAnnouncementsByType(day, type));
    }
    return all;
  }
  private async changeDay(direction: 'prev' | 'next') {
  if (this.isTransitioning) return;
  this.isTransitioning = true;

  // Update currentDayIndex
  if (direction === 'prev') {
    this.currentDayIndex = (this.currentDayIndex - 1 + this.days.length) % this.days.length;
  } else {
    this.currentDayIndex = (this.currentDayIndex + 1) % this.days.length;
  }

  this.logger.log(`[changeDay] → ${this.currentDayIndex}`);

  // 1️⃣ Reset scroll
  await this.resetScrollPosition();

  // 2️⃣ Load & display content baru
  await this.resetDay();

  // 3️⃣ Update CSS class fullscreen
  this.updateFullscreenClass();

  this.isTransitioning = false;
}



public cleanupBeforeExit(): void {
  // Stop semua slide/scroll/timer
  this.isAutoFlowActive = false;
  this.stopAllScroll();

  // Stop countdown
  this.isAutoFlowActive = false;
  this.stopAllScroll();
  this.timerSubscription?.unsubscribe();
  clearTimeout(this.hideControlsTimer);
  clearTimeout(this.holdTimer);
  clearInterval(this.loadAnnouncementsInterval);
  clearInterval(this.checkNewDayInterval);
  clearInterval(this.dateTimeInterval);
  clearInterval(this.check6amInterval);


  // Reset hebahan index
  this.hebahanIndex = 0;

  // Reset fullscreen
  if (this.isFullscreen) {
    this.toggleFullscreen();
  }

  // Reset controls visibility
  this.controlsVisible = true;

  this.logger.log('[TvDisplayPage] cleanupBeforeExit executed');
}

}
