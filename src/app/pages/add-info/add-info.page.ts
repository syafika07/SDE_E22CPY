import { Component, ViewChild, AfterViewInit, HostBinding } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonChip,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  ModalController,
  IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';

import { DatetimeModalComponent } from './../../components/datetime-modal/datetime-modal.component';
import { SupabaseService, Announcement } from './../../services/supabase.service';
import { Header2Component } from 'src/app/components/header2/header2.component';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-add-info',
  templateUrl: './add-info.page.html',
  styleUrls: ['./add-info.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonChip,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonIcon,
    Header2Component,
    QuillModule
  ]
})
export class AddInfoPage implements AfterViewInit {
  @HostBinding('class.ion-padding') forceLightMode = true;

  @ViewChild('quillEditor') quillEditor!: QuillEditorComponent;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  announcement = {
    title: '',
    ann_type: '' as 'Cuti' | 'Hebahan' | 'Meeting' | '',
    dates: [] as string[],
    namaList: [] as string[],
    currentNama: '',
    jenisCuti: '',
    location: ''
  };

  isSaving = false;

  constructor(
    private modalCtrl: ModalController,
    private supabaseService: SupabaseService,
    private logger: NGXLogger
  ) {}

  ngAfterViewInit() {
    // Kosongkan Quill bila mula
    setTimeout(() => {
      if (this.quillEditor?.quillEditor) {
        this.quillEditor.quillEditor.setText('');
      }
    }, 100);
  }

  async openDatetimeModal() {
    const modal = await this.modalCtrl.create({
      component: DatetimeModalComponent,
      componentProps: {
        close: (dates: string[]) => modal.dismiss(dates)
      }
    });

    modal.onDidDismiss().then(res => {
      if (res?.data) this.announcement.dates = res.data;
    });

    await modal.present();
  }

  addNama() {
    const name = this.announcement.currentNama.trim();
    if (name && !this.announcement.namaList.includes(name)) {
      this.announcement.namaList.push(name);
    }
    this.announcement.currentNama = '';
  }

  removeNama(index: number) {
    this.announcement.namaList.splice(index, 1);
  }

  removeDate(index: number) {
    this.announcement.dates.splice(index, 1);
  }

  onJenisChange(event: any) {
    const selected = event.detail.value;
    if (selected !== 'Cuti') this.announcement.jenisCuti = '';
    if (selected !== 'Meeting') this.announcement.location = '';
    if (selected === 'Cuti') {
      this.announcement.title = '';
      setTimeout(() => {
        if (this.quillEditor?.quillEditor) {
          this.quillEditor.quillEditor.setText('');
        }
      }, 50);
    }
  }

  private getDescriptionAsHtml(): string {
    if (this.announcement.ann_type === 'Cuti') return '';

    const editor = this.quillEditor?.quillEditor;
    if (!editor) {
      this.logger.warn('[AddInfo] ❌ Quill editor not ready');
      return '';
    }

    let html = editor.root.innerHTML;
    if (!html || html === '<p><br></p>' || html === '<div><br></div>') {
      this.logger.log('[AddInfo] Empty content');
      return '';
    }

    return html.trim();
  }

  private async waitForQuillReady(maxWaitMs = 300): Promise<boolean> {
    const start = Date.now();
    while (!this.quillEditor?.quillEditor && Date.now() - start < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    return !!this.quillEditor?.quillEditor;
  }

  async save() {
    // ✅ Tambah currentNama terakhir ke namaList jika ada
    const current = this.announcement.currentNama.trim();
    if (current && !this.announcement.namaList.includes(current)) {
      this.announcement.namaList.push(current);
    }

    if (!this.announcement.ann_type || this.announcement.dates.length === 0) {
      alert('Sila pilih jenis dan tarikh');
      return;
    }

    if (!['Hebahan', 'Cuti', 'Meeting'].includes(this.announcement.ann_type)) {
      alert('Jenis mesti Hebahan, Cuti atau Meeting.');
      return;
    }

    if (this.announcement.ann_type !== 'Cuti') {
      if (!this.announcement.title?.trim()) {
        alert('Sila isi title');
        return;
      }

      const ready = await this.waitForQuillReady();
      if (!ready) {
        this.logger.warn('[AddInfo] Quill still not ready after waiting');
      }

      const html = this.getDescriptionAsHtml();
      if (!html) {
        alert('Sila isi keterangan (description)');
        return;
      }
    }

    this.isSaving = true;

    try {
      for (const dt of this.announcement.dates) {
        let datetimeFormatted: string;
        try {
          datetimeFormatted = this.parseMYDatetime(dt);
        } catch (parseErr) {
          this.logger.error('[AddInfo] Gagal parse tarikh:', dt, parseErr);
          alert(`Ralat format tarikh: "${dt}".\nSila pastikan format dd/MM/yyyy HH:mm`);
          return;
        }

        const payload: Announcement = {
          title: this.announcement.title || '',
          ann_type: this.announcement.ann_type,
          datetime: datetimeFormatted,
          jenis_cuti: this.announcement.jenisCuti || '',
          nama: this.announcement.namaList.join(', ') || '', // ✅ Semua nama disimpan
          location: this.announcement.location || '',
          description: this.announcement.ann_type === 'Cuti' ? '' : this.getDescriptionAsHtml()
        };

        this.logger.log('[AddInfo] Saving payload:', payload);

        await this.supabaseService.addAnnouncement(payload);
      }

      alert('✅ Maklumat berjaya disimpan dalam Supabase!');
      this.resetForm();

    } catch (err) {
      let errorMessage = 'Ralat tidak diketahui';
      let errorDetails = '';
      let errorHint = '';

      if (err && typeof err === 'object') {
        if ('error' in err && err.error && typeof err.error === 'object') {
          const supabaseError = (err as any).error;
          errorMessage = supabaseError.message || 'Tiada mesej ralat';
          errorDetails = supabaseError.details || '';
          errorHint = supabaseError.hint || '';
        } else if ('message' in err) {
          errorMessage = (err as any).message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      this.logger.error('[AddInfo] Save error details:', {
        originalError: err,
        parsedMessage: errorMessage,
        details: errorDetails,
        hint: errorHint
      });

      let alertMsg = `❌ Gagal simpan ke Supabase.\n${errorMessage}`;
      if (errorDetails) alertMsg += `\n\nButiran: ${errorDetails}`;
      if (errorHint) alertMsg += `\n\nCadangan: ${errorHint}`;

      alert(alertMsg);

    } finally {
      this.isSaving = false;
    }
  }


  resetForm() {
    this.announcement = {
      title: '',
      ann_type: '',
      dates: [],
      namaList: [],
      currentNama: '',
      jenisCuti: '',
      location: ''
    };

    setTimeout(() => {
      if (this.quillEditor?.quillEditor) {
        this.quillEditor.quillEditor.setText('');
      }
    }, 50);
  }

  isFormValid(): boolean {
    if (!this.announcement.ann_type || this.announcement.dates.length === 0) return false;
    if (this.announcement.ann_type === 'Cuti') return true;
    return !!this.announcement.title?.trim() && !!this.getDescriptionAsHtml();
  }

  private parseMYDatetime(str: string): string {
    const trimmed = str.trim();
    const parts = trimmed.split(' ');
    if (parts.length < 2) throw new Error(`Format tarikh/masa tidak sah: "${str}"`);

    const [datePart, timePart] = parts;
    const dateSplit = datePart.split('/');
    if (dateSplit.length !== 3) throw new Error(`Format tarikh tidak sah (perlu dd/MM/yyyy): "${datePart}"`);

    let [dd, mm, yyyy] = dateSplit;
    dd = dd.padStart(2, '0');
    mm = mm.padStart(2, '0');

    let timeFormatted = '';
    if (timePart.length === 4 && timePart.includes(':')) {
      const [h, m] = timePart.split(':');
      timeFormatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
    } else if (timePart.length === 5 && timePart.includes(':')) {
      timeFormatted = `${timePart}:00`;
    } else if (timePart.length === 8 && timePart.split(':').length === 3) {
      timeFormatted = timePart;
    } else {
      const num = parseInt(timePart, 10);
      if (!isNaN(num) && num >= 0 && num < 2400) {
        const h = Math.floor(num / 100);
        const m = num % 100;
        timeFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
      } else {
        throw new Error(`Format masa tidak sah: "${timePart}"`);
      }
    }

    const result = `${yyyy}-${mm}-${dd} ${timeFormatted}`;
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(result)) throw new Error(`Hasil format tidak sah: "${result}"`);
    return result;
  }
}
