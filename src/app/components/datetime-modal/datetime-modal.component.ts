import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonDatetime,
  IonContent,
  IonItem,
  IonButton,
  IonLabel,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonImg,
  ModalController, IonChip } from '@ionic/angular/standalone';

@Component({
  selector: 'app-datetime-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonDatetime,
    IonImg
  ],
  templateUrl: './datetime-modal.component.html',
  styleUrls: ['./datetime-modal.component.scss']
})
export class DatetimeModalComponent implements OnInit {

  @Input() initialDates: string[] = [];

  currentDateTime: string = '';
  selectedDateTimes: string[] = [];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (Array.isArray(this.initialDates) && this.initialDates.length > 0) {
      this.selectedDateTimes = this.initialDates
        .map(dt => this.normalizeDate(dt))
        .filter(dt => !!dt)
        .sort((a, b) =>
          new Date(a.replace(' ', 'T')).getTime() - new Date(b.replace(' ', 'T')).getTime()
        );
    }
  }

  private normalizeDate(dt: string): string {
    if (!dt) return '';
    if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dt)) {
      return dt;
    }
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ✅ Masukkan currentDateTime ke list tarikh dipilih
  addCurrentDateTime() {
    if (!this.currentDateTime) return;

    const normalized = this.normalizeDate(this.currentDateTime);
    if (!normalized) return;

    if (!this.selectedDateTimes.includes(normalized)) {
      this.selectedDateTimes.push(normalized);
      this.selectedDateTimes.sort((a, b) =>
        new Date(a.replace(' ', 'T')).getTime() - new Date(b.replace(' ', 'T')).getTime()
      );
    }

    this.currentDateTime = '';
  }

  removeDateTime(dt: string) {
    this.selectedDateTimes = this.selectedDateTimes.filter(d => d !== dt);
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  done() {
    this.modalCtrl.dismiss(this.selectedDateTimes);
  }
}
