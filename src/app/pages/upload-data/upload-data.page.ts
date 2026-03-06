import { environment } from './../../../environments/environment';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { LoadingProgressComponent } from 'src/app/components/loading-progress/loading-progress.component';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonList,
  IonIcon,
  IonSelect,
  IonSelectOption,IonText,
  IonModal,
  IonGrid,IonCol,IonRow
  //IonHeader,IonToolbar,IonTitle,IonButtons
} from '@ionic/angular/standalone';
import { supabase } from 'src/app/services/supabaseClient';

interface UploadCsvResponse {
  status: string;
  rows: number;
  message?: string;
  download?: string;
  duplicate?: number;
}

interface UploadPdfResponse {
  status: string;
  rows: number;
  csv_saved?: string;
  message?: string;
  duplicate?: number;
}

interface DatePaymentSummary {
  date: string;
  displayDate?: string;
  PlazaNo?: string;
  hasTNG: boolean;
  hasENTRYCSC: boolean;
  hasRFID: boolean;
  hasCSC: boolean;
  hasABT: boolean;
  hasABTC: boolean;
  jobNoCSC?: string;
  jobNoABT?: string;
  jobNoENTRYCSC?: string;
}

@Component({
  selector: 'app-upload-data',
  standalone: true,
  imports: [
    HeaderComponent,
    LoadingProgressComponent,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButton,
    IonList,
    IonSelect,
    IonSelectOption,
    DatePipe,
    FormsModule,
    CommonModule,
    IonModal,
    IonIcon,IonGrid,IonCol,IonRow
    //,IonHeader,IonToolbar,IonTitle,IonButtons,
  ],
  templateUrl: './upload-data.page.html',
  styleUrls: ['./upload-data.page.scss'],
})
export class UploadDataPage implements OnInit, OnDestroy {

  selectedFiles: File[] = [];
  pdfFiles: File[] = [];

  loading = false;
  progress = 0;
  dashboardRoute = '/dashboard';
  uploadedRecords: { date: string; PlazaNo: string | null; PaymentMode: string | null }[] = [];
  loadingRecords = false;
  dateSummaries: DatePaymentSummary[] = [];
  originalDateSummaries: DatePaymentSummary[] = [];
  pdfType: 'normal' | 'entry' = 'normal';
  selectedMonth: string = '';
  monthOptions: { value: string; label: string }[] = [];
  plazaOptions: string[] = ['201','202','203','204'];
  selectedPlaza: string = '201';
  modalSelectedPlaza: string = ''; // '' = semua plaza
showNotificationModal = false; // control modal visibility

  loadingMessages: string[] = [
    'Uploading data… Please be patient.',
    'Processing files, this may take more than 15 minutes.',
    'Almost there! Large files require extra processing time.'
  ];
showCheckModal = false;

showNotificationBell = false;

notificationMessage = {
  csvDates: [] as string[],
  pdfDates: [] as string[],
  pdfMissingJobs: [] as {
    date: string;
    missingJobNos: number[];
  }[],
};

get notificationCount(): number {
  return (
    this.notificationMessage.csvDates.length +
    this.notificationMessage.pdfDates.length +
    this.notificationMessage.pdfMissingJobs.length
  );
}

missingRecords: {
  date: string;
  plaza: string;
  missingCSV: string[];
  missingPDF: string[];
}[] = [];


  loadingMessage = this.loadingMessages[0];
  private messageIndex = 0;
  private messageInterval?: ReturnType<typeof setInterval>;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadUploadedDates();
  }

  ngOnDestroy() {
    this.stopLoadingMessages();
  }

  /* ================= FILE SELECTION ================= */
  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = files.filter(f => f.name.toLowerCase().endsWith('.csv'));
    event.target.value = '';
  }

  onPdfSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    event.target.value = '';
  }

  removeCsvFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  removePdfFile(index: number) {
    this.pdfFiles.splice(index, 1);
  }

  /* ================= LOADING MESSAGE ROTATION ================= */
  private startLoadingMessages() {
    this.stopLoadingMessages();
    this.loadingMessage = this.loadingMessages[0];
    this.messageIndex = 0;

    this.messageInterval = setInterval(() => {
      this.messageIndex = (this.messageIndex + 1) % this.loadingMessages.length;
      this.loadingMessage = this.loadingMessages[this.messageIndex];
    }, 5000);
  }

  private stopLoadingMessages() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = undefined;
    }
  }

async uploadAll() {
  if (!this.selectedFiles.length && !this.pdfFiles.length) return;

  this.loading = true;
  this.progress = 0;
  this.startLoadingMessages();

  let csvDone = false;
  let pdfDone = false;
  let csvProgress = 0;
  let pdfProgress = 0;

  let csvSuccess = 0;
  let csvDuplicate = 0;
  let pdfSuccess = 0;
  let pdfDuplicate = 0;

  // ===== Fake progress timer (0 → 90% dalam ~10s) =====
  const fakeProgress = () => {
    return new Promise<void>((resolve) => {
      let p = 0;
      const interval = setInterval(() => {
        if (p < 90) { // sampai 90% sahaja
          p += 1;       // naik 1% setiap 100ms → ~9s
          this.progress = p;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  const updateOverallProgress = () => {
    const totalFiles = this.selectedFiles.length + this.pdfFiles.length;
    if (totalFiles === 0) return;

    let totalProgress = 0;
    let completed = 0;

    if (this.selectedFiles.length > 0) {
      totalProgress += csvProgress * this.selectedFiles.length;
      if (csvDone) completed += this.selectedFiles.length;
    }
    if (this.pdfFiles.length > 0) {
      totalProgress += pdfProgress * this.pdfFiles.length;
      if (pdfDone) completed += this.pdfFiles.length;
    }

    if (completed === totalFiles) {
      this.progress = 100;
      this.loadingMessage = 'Finalizing upload...';
    } else {
      // tetap guna min 99 supaya tak ganggu fake progress
      this.progress = Math.min(99, Math.round(totalProgress / totalFiles));
      this.loadingMessage =
        !csvDone ? 'Uploading CSV files...' :
        !pdfDone ? 'Processing PDF files...' :
        'Finalizing upload...';
    }
  };

  try {
    const fake = fakeProgress();

    /* ===== CSV UPLOAD ===== */
    if (this.selectedFiles.length > 0) {
      const formDataCsv = new FormData();
      this.selectedFiles.forEach(file =>
        formDataCsv.append('files', file, file.name)
      );

      const csvObs = this.http.post<UploadCsvResponse>(

        'https://bkend-uim4.onrender.com/upload',
        //'http://localhost:8000/upload',

        formDataCsv,
        { reportProgress: true, observe: 'events' }
      );

      try {
        const event = await lastValueFrom(csvObs);
        const res = (event as any).body;
        if (res?.status !== 'success') {
          throw new Error(res?.message || 'CSV upload failed');
        }
        csvDone = true;
        csvSuccess = typeof res.rows === 'number' ? res.rows : 0;
        csvDuplicate = typeof res.duplicate === 'number' ? res.duplicate : 0;
        if (res.download) this.downloadFile(res.download, 'filtered_new_rows.csv');
        updateOverallProgress();
      } catch (err: any) {
        throw new Error(err?.error?.message || err?.message || 'CSV upload failed');
      }
    } else {
      csvDone = true;
      updateOverallProgress();
    }

    /* ===== PDF UPLOAD ===== */
    if (this.pdfFiles.length > 0) {

      const formDataPdf = new FormData();

      this.pdfFiles.forEach(file =>
        formDataPdf.append('files', file, file.name)
      );

      // ✅ PILIH ENDPOINT BERDASARKAN TYPE
      const pdfUrl =
        this.pdfType === 'entry'
         //?'http://localhost:8000/entry-pdf'
          ?'https://bkend-uim4.onrender.com/entry-pdf'

          //:'http://localhost:8000/upload-pdf';
          :'https://bkend-uim4.onrender.com/upload-pdf';

      const pdfObs = this.http.post<UploadPdfResponse>(

        pdfUrl,

        formDataPdf,
        {
          reportProgress: true,
          observe: 'events'
        }
      );


      try {

        const event = await lastValueFrom(pdfObs);

        const res = (event as any).body;

        if (res?.status !== 'success') {
          throw new Error(res?.message || 'PDF upload failed');
        }

        pdfDone = true;

        pdfSuccess = typeof res.rows === 'number' ? res.rows : 0;
        pdfDuplicate = typeof res.duplicate === 'number' ? res.duplicate : 0;

        if (res.csv_saved) {
          this.downloadFile(res.csv_saved, 'filtered_new_rows.csv');
        }

        updateOverallProgress();


      } catch (err: any) {

        throw new Error(
          err?.error?.message ||
          err?.message ||
          'PDF upload failed'
        );

      }

    } else {

      pdfDone = true;
      updateOverallProgress();

    }

    // tunggu fake progress siap sebelum set 100%
    await fake;
    this.progress = 100;
    this.loadingMessage = 'Refreshing data...';

    await this.http.post('https://bkend-uim4.onrender.com/refresh-payment-summary', {}).toPromise();

    const message = `
    Upload Data Successfully!
    ${this.selectedFiles.length ? `CSV - Success: ${csvSuccess ?? 0}, Duplicate: ${csvDuplicate ?? 0}\n` : ''}
    ${this.pdfFiles.length ? `PDF - Success: ${pdfSuccess ?? 0}, Duplicate: ${pdfDuplicate ?? 0}\n` : ''}
    `.trim();

    await this.alertCtrl.create({
      header: 'Success',
      message,
      buttons: ['OK']
    }).then(a => a.present());

    this.resetForm();


  } catch (err: any) {
    // stop loading sebelum alert
    this.stopLoadingMessages();
    this.loading = false;
    this.progress = 0;

    await this.alertCtrl.create({
      header: 'Upload Error',
      message: err?.message || 'Server unreachable',
      buttons: ['OK']
    }).then(a => a.present());
  } finally {
    this.stopLoadingMessages();
    setTimeout(() => {
      this.loading = false;
      this.progress = 0;
    }, 300);
  }
}


private resetForm() {
  this.selectedFiles = [];
  this.pdfFiles = [];
}


  private downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openDashboard() {
    window.open(
      'https://lookerstudio.google.com/embed/reporting/ee7709a4-73a8-4176-b95a-e8c29d4f1a9c/page/7NuaF',
      '_blank'
    );
  }
filterByMonthAndPlaza() {
  if (!this.selectedMonth || !this.originalDateSummaries.length) {
    this.dateSummaries = [];
    return;
  }

  this.dateSummaries = this.originalDateSummaries.filter(item => {
    const itemDate = new Date(item.date);
    const itemYearMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
    const monthMatch = itemYearMonth === this.selectedMonth;

    // Plaza filter: normalize and remove "-"
    let plazaMatch = true;
    if (this.selectedPlaza) {
      const plazas = item.PlazaNo?.split(',')
                        .map(p => p.trim())
                        .filter(p => p && p !== '-') || [];
      plazaMatch = plazas.includes(this.selectedPlaza);
    }

    return monthMatch && plazaMatch;
  });

  this.checkMissingByPlaza();

}


  onMonthChange() {
    this.filterByMonthAndPlaza();
    this.checkMissingByPlaza();
  }

  onPlazaChange() {
    this.filterByMonthAndPlaza();
    this.checkMissingByPlaza();
  }

  /* ================= LOAD UPLOADED DATES ================= */
async loadUploadedDates() {
  this.loadingRecords = true;

  try {
    // 🔹 Step 0: Refresh materialized views
    //await this.http .post('https://bkend-uim4.onrender.com/refresh-payment-summary', {}) .toPromise();

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

    // 🔹 Step 1: CSC / ABT per plaza
    const { data: perPlazaData, error: perPlazaError } = await supabase
      .from('date_payment_summary_per_plaza')
      .select('date, PlazaNo, jobnos')
      .gte('date', threeMonthsAgoStr);
    if (perPlazaError) throw perPlazaError;

    // 🔹 Step 2: TNG / RFID / ABTC per plaza (IMPORTANT FIX)
    const { data: cashlessData, error: cashlessError } = await supabase
      .from('date_payment_summary_cashless_per_plaza')
      .select('date, PlazaNo, payment_modes')
      .gte('date', threeMonthsAgoStr);
    if (cashlessError) throw cashlessError;

        // 🔹 Step 1b: ENTRYCSC per plaza
    const { data: entryCSCData, error: entryCSCError } = await supabase
      .from('date_payment_summary_entrycsc')
      .select('date, PlazaNo, jobnos')  // Sama macam per_plaza
      .gte('date', threeMonthsAgoStr);
    if (entryCSCError) throw entryCSCError;

// 🔹 Map ENTRYCSC
const entryCSCMap = new Map<string, string[]>();
(entryCSCData || []).forEach(row => {
  const key = `${row.date}|${row.PlazaNo}`;
  entryCSCMap.set(key, Array.isArray(row.jobnos) ? row.jobnos.map(String) : []);
});
    // 🔹 Step 3: Build MAPS (FAST & CORRECT)
    const cscAbtMap = new Map<string, string[]>(); // date|plaza -> jobnos
    (perPlazaData || []).forEach(row => {
      const key = `${row.date}|${row.PlazaNo}`;
      cscAbtMap.set(
        key,
        Array.isArray(row.jobnos) ? row.jobnos.map(String) : []
      );
    });

    const cashlessMap = new Map<string, string[]>(); // date|plaza -> payment_modes
    (cashlessData || []).forEach(row => {
      const key = `${row.date}|${row.PlazaNo}`;
      cashlessMap.set(
        key,
        Array.isArray(row.payment_modes)
          ? row.payment_modes.filter((pm: string) =>
              ['TNG', 'RFID', 'ABTC'].includes(pm)
            )
          : []
      );
    });

    // 🔹 Step 4: Merge per DATE + PLAZA
    const mergedMap = new Map<string, DatePaymentSummary>();
    const requiredPlazas = ['201', '202', '203', '204'];

    const allDates = new Set<string>();
    perPlazaData?.forEach(r => allDates.add(r.date));
    cashlessData?.forEach(r => allDates.add(r.date));

allDates.forEach(date => {
  requiredPlazas.forEach(plaza => {
    const key = `${date}|${plaza}`;

    // CSC / ABT
    const jobNumbers = cscAbtMap.get(key) || [];
    const sortedJobs = Array.from(
      new Set(jobNumbers.map(n => Number(n)))
    )
      .sort((a, b) => a - b)
      .map(String);

    // Cashless: TNG / RFID / ABTC
    const plazaModes = cashlessMap.get(key) || [];

    // ENTRYCSC
    const jobNumbersEntryCSC = entryCSCMap.get(key) || [];
    const sortedJobsEntryCSC = Array.from(
      new Set(jobNumbersEntryCSC.map(n => Number(n)))
    )
      .sort((a, b) => a - b)
      .map(String);

    mergedMap.set(key, {
      date,
      displayDate: new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      PlazaNo: plaza,

      // CSC / ABT
      hasCSC: jobNumbers.length > 0,
      hasABT: jobNumbers.length > 0,
      jobNoCSC: sortedJobs.join(', '),
      jobNoABT: sortedJobs.join(', '),

      // ENTRYCSC
      hasENTRYCSC: jobNumbersEntryCSC.length > 0,
      jobNoENTRYCSC: sortedJobsEntryCSC.join(', '),

      // Cashless
      hasTNG: plazaModes.includes('TNG'),
      hasRFID: plazaModes.includes('RFID'),
      hasABTC: plazaModes.includes('ABTC')
    });
  });
});


    // 🔹 Step 5: Simpan & sort
    this.originalDateSummaries = Array.from(mergedMap.values()).sort(
      (a, b) => b.date.localeCompare(a.date)
    );

    // 🔹 Step 6: Month options
    const uniqueYearMonths = new Set<string>();
    this.originalDateSummaries.forEach(item => {
      const d = new Date(item.date);
      uniqueYearMonths.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      );
    });

    const sortedYearMonths = Array.from(uniqueYearMonths).sort(
      (a, b) => new Date(b + '-01').getTime() - new Date(a + '-01').getTime()
    );

    this.monthOptions = sortedYearMonths.map(ym => {
      const [year, month] = ym.split('-');
      return {
        value: ym,
        label: new Date(+year, +month - 1, 1).toLocaleDateString('ms-MY', {
          month: 'long',
          year: 'numeric'
        })
      };
    });

    this.selectedMonth = sortedYearMonths.includes(this.selectedMonth)
      ? this.selectedMonth
      : this.monthOptions[0]?.value ?? '';

    // 🔹 Step 7: Plaza options
    this.plazaOptions = [...new Set(requiredPlazas)].sort();

      this.filterByMonthAndPlaza();

  } catch (err: any) {
    console.error('Ralat memuatkan tarikh:', err.message || err);
    this.dateSummaries = [];
    this.originalDateSummaries = [];
    this.monthOptions = [];
    this.plazaOptions = [];
  } finally {
    this.loadingRecords = false;
  }
this.filterByMonthAndPlaza();
this.checkMissingByPlaza();


}


openNotification() {
  this.showNotificationModal = true;
}
private checkMissingPdfJobNo(date: string, jobNos: string[]) {
  if (!jobNos || jobNos.length === 0) return;

  // convert & sort
  const nums = Array.from(new Set(jobNos.map(n => Number(n))))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  if (!nums.length) return;

  const maxJob = Math.max(...nums);
  const expected = Array.from({ length: maxJob }, (_, i) => i + 1);
  const missing = expected.filter(j => !nums.includes(j));

  if (missing.length) {
    this.notificationMessage.pdfMissingJobs.push({
      date,
      missingJobNos: missing
    });
  }
}
checkMissingByPlaza() {
  this.notificationMessage.csvDates = [];
  this.notificationMessage.pdfDates = [];
  this.notificationMessage.pdfMissingJobs = [];
  this.showNotificationBell = false;

  if (!this.selectedMonth || !this.selectedPlaza) return;

  this.dateSummaries.forEach(item => {
    const d = new Date(item.date);
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

    if (ym !== this.selectedMonth) return;
    if (item.PlazaNo !== this.selectedPlaza) return;

    const displayDate = d.toLocaleDateString('en-GB');

    /* ================= CSV ================= */
    if (!item.hasTNG || !item.hasRFID || !item.hasABTC) {
      this.notificationMessage.csvDates.push(displayDate);
    }

    /* ================= PDF BASIC ================= */
    if (!item.hasCSC || !item.hasABT) {
      this.notificationMessage.pdfDates.push(displayDate);
    }

    /* ================= PDF JOBNO CHECK ================= */
    const jobNos =
      item.jobNoCSC
        ?.split(',')
        .map(j => j.trim())
        .filter(Boolean) || [];

    this.checkMissingPdfJobNo(displayDate, jobNos);
  });

  // buang duplicate
  this.notificationMessage.csvDates = [...new Set(this.notificationMessage.csvDates)];
  this.notificationMessage.pdfDates = [...new Set(this.notificationMessage.pdfDates)];

  this.showNotificationBell =
    this.notificationMessage.csvDates.length > 0 ||
    this.notificationMessage.pdfDates.length > 0 ||
    this.notificationMessage.pdfMissingJobs.length > 0;
}

closeModal(event: any) {
  // Klik di luar missing-section → close modal
  this.showNotificationModal = false;
}

ngAfterViewInit() {
  const bell = document.querySelector('.notification-fab img');
  if (bell) {
    setInterval(() => {
      bell.classList.add('shake');
      bell.addEventListener('animationend', () => {
        bell.classList.remove('shake');
      }, { once: true });
    }, 5000);
  }
}

showTooltipBox = false;
tooltipX = 0;
tooltipY = 0;

showTooltip(event: MouseEvent) {
  const tooltip = document.getElementById('global-tooltip');

  if (tooltip) {
    tooltip.style.display = 'block';
    tooltip.style.top = event.clientY + 12 + 'px';
    tooltip.style.left = event.clientX + 12 + 'px';
  }
}

hideTooltip() {
  const tooltip = document.getElementById('global-tooltip');

  if (tooltip) {
    tooltip.style.display = 'none';
  }
}


}
