import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonCheckbox,
  IonCard,
  IonItem,
  IonLabel,
  IonInput,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonChip,
  ModalController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { Header2Component } from 'src/app/components/header2/header2.component';
import { DatetimeModalComponent } from './../../components/datetime-modal/datetime-modal.component';
import { SupabaseService, Announcement } from '../../services/supabase.service';
import { NGXLogger } from 'ngx-logger';

interface WeekGroup {
  week: number;
  announcements: AnnouncementView[];
  allSelected: boolean;
}

interface MonthGroup {
  year: number;
  monthNum: number;
  monthLabel: string;
  weeks: WeekGroup[];
  allSelected?: boolean;
}

type AnnType = 'Cuti' | 'Hebahan' | 'Meeting';

type AnnouncementView = Announcement & {
  _datetimeList: Date[];
  _year: number;
  _monthNum: number;
  _weekNum: number;
  _jenis: AnnType;
};

@Component({
  selector: 'app-edit-info',
  templateUrl: './edit-info.page.html',
  styleUrls: ['./edit-info.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonContent,
    IonButton,
    IonCheckbox,
    IonCard,
    IonItem,
    IonLabel,
    IonInput,
    IonCardContent,
    IonSelect,
    IonSelectOption,
    IonChip,
    Header2Component,
    QuillModule,
  ]
})
export class EditInfoPage implements OnInit, AfterViewInit {

  @ViewChild('quillEditor') quillEditor!: QuillEditorComponent;

  // DATA
  announcements: AnnouncementView[] = [];
  groupedAnnouncements: MonthGroup[] = [];
  filteredAnnouncements: AnnouncementView[] = [];

  // FILTER STATE (stepwise)
  availableYears: number[] = [];
  availableMonths: { value: number; label: string }[] = [];
  availableWeeks: number[] = [];

  selectedYear: number | null = null;
  selectedMonth: number | null = null;
  selectedWeek: number | null = null;
  selectedJenis: string = '';

  totalVisibleAnnouncements = 0;

  // SELECT MODE
  selectMode = false;
  selectedMap: Record<string, boolean> = {};

  get selectedIds(): Set<string> {
    const ids = new Set<string>();
    Object.entries(this.selectedMap).forEach(([id, selected]) => {
      if (selected && id) ids.add(id);
    });
    return ids;
  }

  // EDIT STATE
  selectedAnnouncement: Announcement | null = null;
  isSaving = false;
  currentNama = '';

  editAnnouncement = {
    id: '',
    title: '',
    ann_type: undefined as AnnType | undefined,
    datetime: '',
    dates: [] as string[],
    description: '',
    jenis_cuti: '',
    namaList: [] as string[],
    location: ''
  };

  // QUILL CONFIG
  quillModules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ header: 1 }, { header: 2 }, 'blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }, { align: [] }],
      ['link', 'image', 'video', 'formula'],
      ['clean']
    ]
  };

  constructor(
    private supabaseService: SupabaseService,
    private modalCtrl: ModalController,
    private logger: NGXLogger
  ) {}

  ngOnInit() {
    this.loadAnnouncements();
  }

  private setCurrentDateAsDefault() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (this.availableYears.includes(currentYear)) {
      this.selectedYear = currentYear;

      const monthsForYear = this.announcements
        .filter(a => a._year === currentYear)
        .map(a => a._monthNum);
      const uniqueMonths = Array.from(new Set(monthsForYear)).sort((a, b) => a - b);

      if (uniqueMonths.includes(currentMonth)) {
        this.selectedMonth = currentMonth;
      } else if (uniqueMonths.length > 0) {
        this.selectedMonth = Math.max(...uniqueMonths);
      }
    } else if (this.availableYears.length > 0) {
      const latestYear = Math.max(...this.availableYears);
      this.selectedYear = latestYear;

      const months = this.announcements
        .filter(a => a._year === latestYear)
        .map(a => a._monthNum);
      const uniqueMonths = Array.from(new Set(months)).sort((a, b) => a - b);
      if (uniqueMonths.length > 0) {
        this.selectedMonth = Math.max(...uniqueMonths);
      }
    }

    this.updateFilterOptions();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.quillEditor?.quillEditor) {
        this.quillEditor.quillEditor.setText('');
      }
    }, 100);
  }

  getWeekInMonth(date: Date, startDay = 1): number {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay();
    const firstDayAdjusted = (firstDayOfWeek + 6) % 7 + 1;
    const offset = (startDay - firstDayAdjusted + 7) % 7;
    const week = Math.ceil((d.getDate() + offset) / 7);
    return week;
  }

  async loadAnnouncements() {
    try {
      const data = await this.supabaseService.getAnnouncements();

      this.announcements = (data || []).map(a => {
        const dtList = this.parseDatetimeList(a.datetime);
        const first = dtList[0] || new Date();
        return {
          ...a,
          _datetimeList: dtList,
          _year: first.getFullYear(),
          _monthNum: first.getMonth() + 1,
          _weekNum: this.getWeekInMonth(first, 1),
          _jenis: a.ann_type as AnnType
        } as AnnouncementView;
      });

      this.updateFilterOptions();

      setTimeout(() => {
        this.setCurrentDateAsDefault();
      }, 0);
    } catch (err) {
      this.logger.error('[EditInfo] Load error:', err);
      alert('Gagal load announcements');
    }
  }

  updateFilterOptions() {
    const allYears = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();

    for (const ann of this.announcements) {
      allYears.add(ann._year);
      const y = ann._year;
      if (!monthsByYear.has(y)) monthsByYear.set(y, new Set());
      monthsByYear.get(y)!.add(ann._monthNum);
    }

    this.availableYears = Array.from(allYears).sort((a, b) => b - a);

    if (this.selectedYear !== null && monthsByYear.has(this.selectedYear)) {
      const months = Array.from(monthsByYear.get(this.selectedYear)!).sort((a, b) => a - b);
      this.availableMonths = months.map(m => ({
        value: m,
        label: new Intl.DateTimeFormat('ms-MY', { month: 'short' }).format(new Date(2024, m - 1))
      }));
    } else {
      this.availableMonths = [];
      this.selectedMonth = null;
      this.availableWeeks = [];
      this.selectedWeek = null;
      return;
    }

    if (this.selectedYear !== null && this.selectedMonth !== null) {
      const firstDay = new Date(this.selectedYear, this.selectedMonth - 1, 1);
      const lastDay = new Date(this.selectedYear, this.selectedMonth, 0);
      const totalDays = lastDay.getDate();

      const firstDayOfWeek = firstDay.getDay();
      const firstDayAdjusted = (firstDayOfWeek + 6) % 7 + 1;
      const offset = (1 - firstDayAdjusted + 7) % 7;
      const weeksInMonth = Math.ceil((totalDays + offset) / 7);

      this.availableWeeks = Array.from({ length: weeksInMonth }, (_, i) => i + 1);
    } else {
      this.availableWeeks = [];
      this.selectedWeek = null;
    }

    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.announcements;

    if (this.selectedYear !== null) {
      filtered = filtered.filter(a => a._year === this.selectedYear);
    }
    if (this.selectedMonth !== null) {
      filtered = filtered.filter(a => a._monthNum === this.selectedMonth);
    }
    if (this.selectedWeek !== null) {
      filtered = filtered.filter(a => a._weekNum === this.selectedWeek);
    }
    if (this.selectedJenis) {
      filtered = filtered.filter(a => a.ann_type === this.selectedJenis);
    }

    this.filteredAnnouncements = filtered;
    this.totalVisibleAnnouncements = filtered.length;

    // Sync selectedMap — buang yang tak visible
    Object.keys(this.selectedMap).forEach(id => {
      if (!filtered.some(a => a.id === id)) {
        this.selectedMap[id] = false;
      }
    });

    this.groupFilteredAnnouncements();
  }

  groupFilteredAnnouncements() {
    const map: Record<string, Record<number, AnnouncementView[]>> = {};

    this.filteredAnnouncements.forEach(ann => {
      const key = `${ann._year}-${ann._monthNum}`;
      map[key] ??= {};
      map[key][ann._weekNum] ??= [];
      map[key][ann._weekNum].push(ann);
    });

    this.groupedAnnouncements = Object.keys(map)
      .map(k => {
        const [y, m] = k.split('-').map(Number);
        const monthLabel = new Intl.DateTimeFormat('ms-MY', {
          month: 'long',
          year: 'numeric'
        }).format(new Date(y, m - 1));
        return { year: y, monthNum: m, monthLabel, weeks: map[k] };
      })
      .sort((a, b) => b.year - a.year || b.monthNum - a.monthNum)
      .map(group => ({
        ...group,
        weeks: Object.keys(group.weeks)
          .map(w => ({
            week: +w,
            announcements: group.weeks[+w],
            allSelected: false
          }))
          .sort((a, b) => b.week - a.week)
      }));
  }

  onYearChange() {
    this.updateFilterOptions();
  }

  onMonthChange() {
    this.updateFilterOptions();
  }

  onWeekChange() {
    this.applyFilters();
  }

  onJenisFilterChange() {
    this.applyFilters();
  }

  selectAnnouncement(ann: Announcement) {
    if (this.selectMode) return;
    this.selectedAnnouncement = ann;

    let dates: string[] = [];
    if (Array.isArray(ann.datetime)) {
      dates = ann.datetime.filter(Boolean);
    } else if (ann.datetime) {
      dates = [ann.datetime];
    }

    // ✅ Ensure dates are VALID before loading
    const validDates = dates.filter(d => this.isDatetimeValid(d));
    if (dates.length > validDates.length) {
      this.logger.warn('[Edit] Some dates invalid in original data', { invalid: dates.filter(d => !this.isDatetimeValid(d)) });
    }

    this.editAnnouncement = {
      id: ann.id!,
      title: ann.title ?? '',
      ann_type: ann.ann_type,
      datetime: validDates[0] ?? '',
      dates: validDates,
      description: ann.ann_type === 'Cuti' ? '' : (ann.description ?? ''),
      jenis_cuti: ann.jenis_cuti ?? '',
      namaList: ann.nama ? ann.nama.split(',').map(n => n.trim()).filter(Boolean) : [],
      location: ann.location ?? ''
    };

    this.currentNama = '';
    setTimeout(() => {
      if (this.quillEditor && this.editAnnouncement.ann_type !== 'Cuti') {
        this.quillEditor.quillEditor.root.innerHTML = this.editAnnouncement.description || '';
      }
    }, 150);
  }

  cancelEdit() {
    this.selectedAnnouncement = null;
    this.isSaving = false;
    this.currentNama = '';
    this.editAnnouncement = {
      id: '',
      title: '',
      ann_type: undefined,
      datetime: '',
      dates: [],
      description: '',
      jenis_cuti: '',
      namaList: [],
      location: ''
    };
  }

  getDescriptionAsHtml(): string {
    if (this.editAnnouncement.ann_type === 'Cuti') return '';
    const editor = this.quillEditor?.quillEditor;
    if (!editor) return '';
    const html = editor.root.innerHTML;
    return (!html || html === '<p><br></p>') ? '' : html.trim();
  }

  addNama() {
    const name = this.currentNama.trim();
    if (name && !this.editAnnouncement.namaList.includes(name)) {
      this.editAnnouncement.namaList.push(name);
    }
    this.currentNama = '';
  }

  removeNama(index: number) {
    this.editAnnouncement.namaList.splice(index, 1);
  }

  async openDatetimeModal(event?: Event) {
    event?.stopPropagation();

    const modal = await this.modalCtrl.create({
      component: DatetimeModalComponent,
      cssClass: 'custom-datetime-modal',
      componentProps: {
        initialDates: [...this.editAnnouncement.dates]
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (Array.isArray(data)) {
      // ✅ Filter invalid dates on return
      this.editAnnouncement.dates = data.filter(d => this.isDatetimeValid(d));
    }
  }

  removeDate(index: number) {
    this.editAnnouncement.dates.splice(index, 1);
  }

  onJenisChange() {
    const type = this.editAnnouncement.ann_type;
    if (!type) return;

    if (type === 'Cuti') {
      this.editAnnouncement.title = '';
      setTimeout(() => {
        if (this.quillEditor?.quillEditor) {
          this.quillEditor.quillEditor.setText('');
        }
      }, 50);
    }
    if (type !== 'Cuti') this.editAnnouncement.jenis_cuti = '';
    if (type !== 'Meeting') this.editAnnouncement.location = '';
  }

  isFormValid(): boolean {
    const { ann_type, dates } = this.editAnnouncement;
    if (!ann_type || dates.length === 0) return false;

    // ✅ Validate all dates
    const allDatesValid = dates.every(d => this.isDatetimeValid(d));
    if (!allDatesValid) return false;

    if (ann_type === 'Cuti') return true;

    const titleValid = !!this.editAnnouncement.title?.trim();
    const descValid = !!this.getDescriptionAsHtml();
    return titleValid && descValid;
  }

formatPostgresTimestamp(date: Date | null): string | null {
  if (!date || isNaN(date.getTime())) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}
 ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

  // ✅ NEW: Safe conversion from UI string (dd/MM/yyyy HH:mm) → PostgreSQL format
  toSupabaseDatetime(dt: string | null): string | null {
    if (!dt) return null;
    const parsed = this.convertToDate(dt);
    return this.formatPostgresTimestamp(parsed);
  }

  // Helper to convert UI string → Date (dd/MM/yyyy HH:mm)
  convertToDate(dt: string): Date | null {
    if (!dt) return null;
    // Try ISO first (e.g., from backend)
    if (dt.includes('T')) {
      const d = new Date(dt);
      return isNaN(d.getTime()) ? null : d;
    }
    // Expect: dd/MM/yyyy [HH:mm]
    const parts = dt.trim().split(' ');
    if (parts.length < 1 || parts.length > 2) return null;

    const datePart = parts[0].split('/');
    if (datePart.length !== 3) return null;

    const [dStr, mStr, yStr] = datePart;
    const day = Number(dStr);
    const month = Number(mStr); // 1-based
    const year = Number(yStr);

    // Validate basic ranges
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;

    let hour = 0, minute = 0;
    if (parts.length === 2) {
      const timeParts = parts[1].split(':');
      if (timeParts.length === 2) {
        hour = Number(timeParts[0]);
        minute = Number(timeParts[1]);
        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
          return null;
        }
      } else {
        return null;
      }
    }

    const date = new Date(year, month - 1, day, hour, minute);
    return isNaN(date.getTime()) ? null : date;
  }

  // ✅ NEW: Validate UI datetime string
  isDatetimeValid(dt: string): boolean {
    return this.convertToDate(dt) !== null;
  }

  parseDatetimeList(dt: string | string[]): Date[] {
    if (!dt) return [];
    const list = Array.isArray(dt) ? dt : [dt];
    return list
      .map(d => this.convertToDate(d))
      .filter((d): d is Date => d !== null);
  }

  async saveEdit() {
    if (this.isSaving || !this.editAnnouncement.id) return;

    if (!this.isFormValid()) {
      alert('Sila lengkapkan maklumat dan pastikan semua tarikh adalah sah (dd/mm/yyyy HH:mm).');
      return;
    }

    // ✅ Validate all dates explicitly
    const invalidDates = this.editAnnouncement.dates.filter(d => !this.isDatetimeValid(d));
    if (invalidDates.length > 0) {
      this.logger.error('[EditInfo] Invalid dates found', { invalid: invalidDates });
      alert(`Tarikh tidak sah: ${invalidDates.join(', ')}. Sila betulkan.`);
      return;
    }

    this.isSaving = true;

    try {
      const baseData: Partial<Announcement> = {
        title: this.editAnnouncement.title,
        ann_type: this.editAnnouncement.ann_type,
        jenis_cuti: this.editAnnouncement.jenis_cuti,
        nama: this.editAnnouncement.namaList.join(', '),
        location: this.editAnnouncement.location,
        description: this.editAnnouncement.ann_type === 'Cuti' ? '' : this.getDescriptionAsHtml()
      };

      // Parse old dates safely
      const oldDatesRaw = this.selectedAnnouncement
        ? (Array.isArray(this.selectedAnnouncement.datetime)
          ? this.selectedAnnouncement.datetime
          : [this.selectedAnnouncement.datetime])
        : [];

      const oldDates = oldDatesRaw
        .map(d => this.toSupabaseDatetime(d))
        .filter((d): d is string => d !== null);

      // ✅ Parse new dates SAFELY — no ! assert
      const newDates = this.editAnnouncement.dates
        .map(d => this.toSupabaseDatetime(d))
        .filter((d): d is string => d !== null);

      if (newDates.length === 0) {
        throw new Error('Tiada tarikh sah untuk disimpan');
      }

      const firstNewDate = newDates[0];

      // 1️⃣ Update existing record
      if (oldDates.includes(firstNewDate)) {
        // Same date → update only content
        await this.supabaseService.updateAnnouncement(this.editAnnouncement.id, {
          ...baseData
        });
      } else {
        // Different date → update datetime too
        await this.supabaseService.updateAnnouncement(this.editAnnouncement.id, {
          ...baseData,
          datetime: firstNewDate
        });
      }

      // 2️⃣ Insert new dates (if any)
      const toInsert = newDates.slice(1).filter(d => !oldDates.includes(d));
      if (toInsert.length > 0) {
        await Promise.all(
          toInsert.map(date =>
            this.supabaseService.createAnnouncement({
              ...baseData,
              datetime: date
            })
          )
        );
      }

      alert('✅ Announcement berjaya dikemaskini');
      this.cancelEdit();
      await this.loadAnnouncements();

    } catch (err) {
      this.logger.error('[EditInfo] Save error:', err);
      alert('❌ Gagal simpan announcement. Sila semak tarikh dan cuba lagi.');
    } finally {
      this.isSaving = false;
    }
  }

  // SELECT MODE
  toggleSelectMode() {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedMap = {};
      this.groupedAnnouncements.forEach(m => {
        m.allSelected = false;
        m.weeks.forEach(w => w.allSelected = false);
      });
    }
  }

  toggleSelect(ann: AnnouncementView) {
    if (ann.id) {
      this.selectedMap[ann.id] = !this.selectedMap[ann.id];
    }
  }

  isSelected(ann: AnnouncementView): boolean {
    return !!ann.id && this.selectedMap[ann.id] === true;
  }

  toggleSelectWeek(week: WeekGroup) {
    const newState = !week.allSelected;
    week.allSelected = newState;
    week.announcements.forEach(a => {
      if (a.id) this.selectedMap[a.id] = newState;
    });
  }

  toggleSelectMonth(month: MonthGroup) {
    const newState = !month.allSelected;
    month.allSelected = newState;
    month.weeks.forEach(week => {
      week.allSelected = newState;
      week.announcements.forEach(a => {
        if (a.id) this.selectedMap[a.id] = newState;
      });
    });
  }

  confirmDelete() {
    const selectedList = this.filteredAnnouncements.filter(
      a => a.id && this.selectedIds.has(a.id)
    );

    if (selectedList.length === 0) {
      alert('Tiada announcement dipilih');
      return;
    }

    if (confirm(`Padam ${selectedList.length} rekod?`)) {
      this.deleteSelected(selectedList);
    }
  }

  async deleteSelected(list: AnnouncementView[]) {
    try {
      await Promise.all(
        list.filter(a => a.id).map(a => this.supabaseService.deleteAnnouncement(a.id!))
      );

      alert('✅ Berjaya dipadam');
      this.toggleSelectMode();
      await this.loadAnnouncements();
    } catch (err) {
      this.logger.error('[EditInfo] Delete error:', err);
      alert('❌ Gagal memadam');
    }
  }
}
