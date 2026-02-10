////
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { SupabaseService } from 'src/app/services/supabase.service';
import { NGXLogger } from 'ngx-logger';
import { LoadingProgressComponent } from './../../components/loading-progress/loading-progress.component';



Chart.register(ChartDataLabels);
Chart.register(...registerables);
// ===== Interface untuk setiap rekod TNG =====
interface TngRecord {
  TrxNo: string;
  PlazaNo: string;
  LaneNo: string;
  EntryPlaza: string;
  TransactionDateTime: string;
  PaymentMode: string;  // boleh jadi eCash, Cash, etc.
  MfgNoTagID: string;
  VehicleNo: string;
  PaidAmount: number;
  FareAmount?: number;
  Balance?: number;
  Trx: string;
  Code: string;
  PenaltyCode: string;
  Remark: string;
  AVC?: string;
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: any;
  }
}


@Component({
  selector: 'app-tng',
  templateUrl: './tng.page.html',
  styleUrls: ['./tng.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,HeaderComponent,LoadingProgressComponent  ],

})
export class TngPage implements OnInit {
    currentUser = {
    name: '',
    email: '',
    role: ''
  };
  // Tambah di atas class (atau dalam class sebagai private method)
private normalizeValue(v: any, keepNullString = false): string {
  // v datang dari API; API mungkin return 'NULL' (string), or null, or ''
  if (v === null || v === undefined) return keepNullString ? 'NULL' : '';
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === 'NULL') return keepNullString ? 'NULL' : ''; // pilih sama ada keep literal 'NULL'
    return t;
  }
  return String(v);
}


  // ======= Data =======
  allData: TngRecord[] = [];
  filteredData: TngRecord[] = [];
  summaryData: any[] = [];
  plazaList: string[] = [];
  originalPlazaList: string[] = []; // Simpan semua plaza kekal
  penaltyCodeList: string[] = [];
  selectedPenaltyCode: string = '';
  filteredSubTable: TngRecord[] = [];
  allPlazaList: string[] = []; // simpan semua PlazaNo
  selectedCode: string = '';
  selectedPenalty: string = '';
  selectedRemark: string = '';
  classSummary: any[] = [];
selectedPlaza: any = [];
selectedPaymentModes: string[] | string = [];
  entryPlazas: string[] = [];         // senarai nama Entry Plaza (contoh: 201, 202, 203)
  trafficSummaryData: any[] = [];


  codeList: string[] = [];
  penaltyList: string[] = [];
  remarkList: string[] = [];

  selectedCodes: string[] = [];
  selectedPenalties: string[] = [];
  selectedRemarks: string[] = [];
  dynamicClassPlaza: any[] = [];
  dynamicEntryPlazas: string[] = [];
  paymentModeList: string[] = [];
  isDownloadingPDF = false;
  isLoading = false;
  originalSubTable: any[] = [];
  progress = 0;



  pageSize = 100;
  currentPage = 1;
  totalPages = 1;


  loading = false;

  // ======= Summary Metrics =======
  totalPaid: number = 0;
  totalTransactions: number = 0;
  totalPlazas: number = 0;

  // ======= Chart References =======
  barChart1: any;
  donutChart: any;
  barChart2: any;

  // ======= API URL =======
private apiUrl = 'https://sde22-1.onrender.com/tng-data';

  // ======= Filters =======
// ganti startDate & endDate
  selectedDate: string = '';

  constructor(private http: HttpClient,private supabaseService: SupabaseService,private logger: NGXLogger) {
    this.logger.debug('AppComponent initialized');
}

async ngOnInit() {
  const today = new Date().toISOString().split('T')[0];
  this.selectedDate = today;
  this.applyFilter();

  // === Load current user ===
  try {
    const user = await this.supabaseService.getUser();
    if (!user) return;

    const profile = await this.supabaseService.getProfile(user.id);
    if (!profile) return;

    this.currentUser = {
      name: this.capitalizeName(profile.name || ''),
      email: profile.email || '',
      role: profile.role || 'user'
    };
  } catch (err) {
    this.logger.error('Failed to load user profile:', err);
  }
}

applyFilter() {
  this.loading = true;  // untuk show spinner
  this.progress = 0;    // reset progress

  // Interval untuk naikkan progress sikit demi sikit
  const interval = setInterval(() => {
    if (this.progress < 95) { // jangan penuh terus, tunggu API
      this.progress += 1;
    }
  }, 50); // setiap 50ms naik 1%

  // Prepare params API
  const params: any = { start_date: this.selectedDate };

  // Plaza filter
  if (Array.isArray(this.selectedPlaza) && this.selectedPlaza.length > 0) {
    params.plazas = this.selectedPlaza.join(',');
  } else if (typeof this.selectedPlaza === 'string' && this.selectedPlaza.trim() !== '') {
    params.plazas = this.selectedPlaza;
  }

  // Payment Modes filter
  if (this.selectedPaymentModes) {
    if (Array.isArray(this.selectedPaymentModes) && this.selectedPaymentModes.length > 0) {
      params.payment_modes = this.selectedPaymentModes.join(',');
    } else if (typeof this.selectedPaymentModes === 'string' && this.selectedPaymentModes.trim() !== '') {
      params.payment_modes = this.selectedPaymentModes;
    }
  }

  // Call API
  this.http.get<any>(this.apiUrl, { params }).subscribe({
    next: (res) => {
      clearInterval(interval); // stop fake progress
      this.progress = 100;     // lengkapkan progress
      this.loading = false;

      if (res.status === 'success') {
        // Mapping data
        this.allData = (res.data || []).map((d: any) => ({
          TrxNo: this.normalizeValue(d.TrxNo, true),
          PlazaNo: this.normalizeValue(d.PlazaNo, true),
          EntryPlaza: this.normalizeValue(d.EntryPlaza, true),
          LaneNo: this.normalizeValue(d.LaneNo, true),
          TransactionDateTime: this.normalizeValue(d.TransactionDateTime, true),
          PaymentMode: this.normalizeValue(d.PaymentMode, true),
          MfgNoTagID: this.normalizeValue(d.MfgNoTagID, true),
          VehicleNo: this.normalizeValue(d.VehicleNo, true),
          PaidAmount: Number(d.PaidAmount) || 0,
          FareAmount: Number(d.FareAmount) || 0,
          Balance: Number(d.Balance) || 0,
          AVC: this.normalizeValue(d.AVC, true),
          Code: this.normalizeValue(d.Code, true),
          PenaltyCode: this.normalizeValue(d.PenaltyCode, true),
          Remark: this.normalizeValue(d.Remark, true),
          Trx: this.normalizeValue(d.Trx, true),
        }));

        this.logger.debug('🟢 RAW TNG API sample (first 5):', (res.data || []).slice(0, 5));

        // Simpan Plaza list untuk dropdown
        if (!this.originalPlazaList || this.originalPlazaList.length === 0) {
          this.originalPlazaList = [...new Set(this.allData.map(d => d.PlazaNo))].sort();
        }
        this.plazaList = [...this.originalPlazaList];
        this.totalPlazas = this.originalPlazaList.length;

        // Filter & update data ikut user
        this.filterData();
        this.updateDropdownLists();
        this.calculateSummaryMetrics();
        this.updateSummaryTable();
        this.updateCharts();
        this.updateFilteredSubTable();
        this.updateClassSummary();

        const tableResult = this.generateClassPlazaSummary();
        this.dynamicClassPlaza = tableResult.summary;
        this.dynamicEntryPlazas = tableResult.entryPlazas;
        this.originalSubTable = [...this.allData];

      } else {
        this.resetData();
      }
    },
    error: (err) => {
      clearInterval(interval); // stop fake progress
      this.progress = 100;
      this.loading = false;
      this.logger.error('❌ Error fetching TNG data:', err);
      this.resetData();
    }
  });
}


  // =======================
  //  Filter kombinasi Plaza + Penalty
  // =======================

  filterData() {
  const normalize = (val: any) => {
    if (val === null || val === undefined || val === '' || val === 'NULL') return '(No Value)';
    return String(val).trim();
  };

  let data = [...this.allData];

  // Filter ikut Plaza
  if (this.selectedPlaza && this.selectedPlaza.length > 0) {
    data = data.filter(d => this.selectedPlaza.includes(normalize(d.PlazaNo)));
  }

  // Filter ikut PenaltyCode
  if (this.selectedPenaltyCode && this.selectedPenaltyCode !== '') {
    data = data.filter(d => normalize(d.PenaltyCode) === normalize(this.selectedPenaltyCode));
  }

  //  Sort ikut TransactionDateTime descending
  data.sort((a, b) => new Date(b.TransactionDateTime).getTime() - new Date(a.TransactionDateTime).getTime());

  this.filteredData = data;

  this.updateClassSummary();
}


  // =======================
  //  Bila PlazaNo berubah
  // =======================

onPlazaChange() {
  // Filter data ikut PlazaNo terpilih
  this.filterData();

  // Update semua dropdown ikut filtered data
  this.updateDropdownLists();

  // Refresh metrics, table & charts
  this.refreshDashboard();
}

onPenaltyChange() {
  // Filter data ikut PenaltyCode terpilih
  this.filterData();

  // Update semua dropdown ikut filtered data
  this.updateDropdownLists();

  // Refresh metrics, table & charts
  this.refreshDashboard();
}

refreshDashboard() {
  this.calculateSummaryMetrics();    // kira total transactions & total paid
  this.updateSummaryTable();         // update summary table
  this.updateCharts();               // update charts
  this.updateFilteredSubTable();     // update sub-table dengan pagination
}


  // =======================
  //  Kira total metrics
  // =======================
  calculateSummaryMetrics() {
    this.totalTransactions = this.filteredData.length;
    this.totalPaid = this.filteredData.reduce((sum, d) => sum + (Number(d.PaidAmount) || 0), 0);
  }

  // =======================
  //  Update Subset Table
  // =======================



  updateFilteredSubTable() {
  this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);

  if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  if (this.currentPage < 1) this.currentPage = 1;

  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;

  // slice dari filteredData yang sudah di-update oleh applyTableFilter()
  this.filteredSubTable = this.filteredData.slice(start, end).map(row => ({
    TrxNo: row.TrxNo,
    PlazaNo: row.PlazaNo,
    EntryPlaza: row.EntryPlaza,
    LaneNo: row.LaneNo,
    TransactionDateTime: row.TransactionDateTime,
    PaymentMode: row.PaymentMode,
    MfgNoTagID: row.MfgNoTagID,
    VehicleNo: row.VehicleNo,
    PaidAmount: row.PaidAmount,
    PenaltyCode: row.PenaltyCode,
    Code: row.Code,
    Remark: row.Remark,
    Trx: row.Trx
  }));
}

applyTableFilter() {
  // filter berdasarkan dropdown table sahaja
  const tableFiltered = this.filteredData.filter(row => {
    const codeVal = row.Code || '';
    const penaltyVal = row.PenaltyCode || '';
    const remarkVal = row.Remark || '';
    const paymentVal = row.PaymentMode || '';

    const codeMatch = this.selectedCodes.length ? this.selectedCodes.includes(this.normalizeValue(codeVal)) : true;
    const penaltyMatch = this.selectedPenalties.length ? this.selectedPenalties.includes(this.normalizeValue(penaltyVal)) : true;
    const remarkMatch = this.selectedRemarks.length ? this.selectedRemarks.includes(this.normalizeValue(remarkVal)) : true;
    const paymentMatch = this.selectedPaymentModes.length ? this.selectedPaymentModes.includes(this.normalizeValue(paymentVal)) : true;

    return codeMatch && penaltyMatch && remarkMatch && paymentMatch;
  });

  this.currentPage = 1;

  // slice untuk pagination
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;

  this.filteredSubTable = tableFiltered.slice(start, end);
}



  // =======================
  //  Summary Table
  // =======================
  updateSummaryTable() {
    const summaryMap: any = {};
    this.filteredData.forEach((row) => {
      const key = row.EntryPlaza || 'Unknown';
      summaryMap[key] = (summaryMap[key] || 0) + 1;
    });

    this.summaryData = Object.keys(summaryMap).map((plaza) => ({
      EntryPlaza: plaza,
      total: summaryMap[plaza],
    }));
  }

  // =======================
  //  Charts
  // =======================
  updateCharts() {
    this.createBarChart1();
    this.createDonutChart();
    this.createBarChart2();
  }

createBarChart1() {
  const ctx = document.getElementById('barChart1') as HTMLCanvasElement;
    if (!ctx) return; // <-- Tambah ini

  if (this.barChart1) {
    this.barChart1.destroy(); // pastikan chart lama dimusnahkan
    this.barChart1 = null;   // <-- tambah ini
  }

  const grouped = this.groupByCount(this.filteredData, 'EntryPlaza');
  const labels = Object.keys(grouped);
  const data = Object.values(grouped);

  // Gradient biru tua (chart1)
  const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, ctx.height);
  gradient.addColorStop(0.5, '#00d5ffff'); // atas gelap
  gradient.addColorStop(1, '#02203bff');  // bawah cerah

  this.barChart1 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Jumlah EntryPlaza',
          data,
          backgroundColor: gradient
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    },
    plugins: [
      ChartDataLabels,
      {
        id: 'custom-bar-labels',
        afterDatasetsDraw: (chart: any) => {
          chart.data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar: any, index: number) => {
              const ctx = chart.ctx;
              ctx.save();
              ctx.fillStyle = '#000000ff';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              const x = bar.x;
              const yTop = bar.y;
              const yBottom = bar.base;
              const barHeight = yBottom - yTop;

              //  TUKAR SINI — paparkan tanpa perpuluhan
              const value = Math.round(dataset.data[index]);

              if (barHeight > 15)
                ctx.fillText(value.toString(), x, yTop + 10);
              else
                ctx.fillText(value.toString(), x, yTop - 2);

              ctx.restore();
            });
          });
        }
      }
    ]
  });
}


createBarChart2() {
  const ctx = document.getElementById('barChart2') as HTMLCanvasElement;
    if (!ctx) return; // <-- Tambah ini

  if (this.barChart2) {
    this.barChart2.destroy(); // pastikan chart lama dimusnahkan
    this.barChart2 = null;   // <-- tambah ini
  }
  const grouped = this.groupByCount(this.filteredData, 'Trx');
  const labels = Object.keys(grouped);
  const data = Object.values(grouped);

  // Gradient biru muda (chart2)
  const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, ctx.height);
  gradient.addColorStop(0.5, '#50ffc2ff'); // atas gelap
  gradient.addColorStop(1, '#0071a9ff');  // bawah cerah

  this.barChart2 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Jumlah Trx',
          data,
          backgroundColor: gradient
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    },
    plugins: [
      ChartDataLabels,
      {
        id: 'custom-bar-labels',
        afterDatasetsDraw: (chart: any) => {
          chart.data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar: any, index: number) => {
              const ctx = chart.ctx;
              ctx.save();
              ctx.fillStyle = '#000000ff';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              const x = bar.x;
              const yTop = bar.y;
              const yBottom = bar.base;
              const barHeight = yBottom - yTop;

              //  Paparkan tanpa perpuluhan
              const value = Math.round(dataset.data[index]);

              if (barHeight > 15)
                ctx.fillText(value.toString(), x, yTop + 10);
              else
                ctx.fillText(value.toString(), x, yTop - 2);

              ctx.restore();
            });
          });
        }
      }
    ]
  });
}

createDonutChart() {
  const ctx = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!ctx) return; // <-- Tambah ini

  if (this.donutChart) {
    this.donutChart.destroy(); // pastikan chart lama dimusnahkan
    this.donutChart= null;   // <-- tambah ini
  }
  const grouped = this.groupBySum(this.filteredData, 'PlazaNo', 'PaidAmount');

  this.donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(grouped),
      datasets: [{
        label: 'PaidAmount',
        data: Object.values(grouped),
        backgroundColor: [
          '#00FFFF', // cyan terang
          '#00CED1', // dark cyan
          '#40E0D0', // turquoise
          '#48D1CC', // medium turquoise
          '#20B2AA'  // light sea green
        ],
        borderColor: '#fff',
        borderWidth: 1
      }],
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          color: '#000000ff',         // kelabu gelap
          font: { size: 9 },    // saiz kecil
          formatter: (value: any, context: any) => {
            return 'RM ' + Number(value).toFixed(2);
          },
          anchor: 'center',      // default dalam slice
          align: (context: any) => {
            const value = context.dataset.data[context.dataIndex];
            // kalau slice terlalu kecil (<5% dari total), letak luar slice
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            return value / total > 0.05 ? 'center' : 'end';
          },
          clamp: true            // pastikan tidak keluar canvas
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const value = tooltipItem.raw;
              return `RM ${Number(value).toFixed(2)}`;
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

  // =======================
  //  Utility
  // =======================
groupByCount(data: any[], key: string): any {
  const result: any = {};
  data.forEach((row) => {
    let k = row[key];
    if (k === '' || k === null || k === undefined) k = 'NULL';
    result[k] = (result[k] || 0) + 1;
  });
  return result;
}
  groupBySum(data: any[], key: string, sumKey: string): any {
    const result: any = {};
    data.forEach((row) => {
      const k = row[key] || 'Unknown';
      const val = Number(row[sumKey]) || 0;
      result[k] = (result[k] || 0) + val;
    });
    return result;
  }

  // =======================
  //  Reset
  // =======================
  resetData() {
    this.allData = [];
    this.filteredData = [];
    this.summaryData = [];
    this.plazaList = [];
    this.originalPlazaList = [];
    this.selectedPlaza = [];
    this.penaltyCodeList = [];
    this.selectedPenaltyCode = '';
    this.filteredSubTable = [];
    this.totalPaid = 0;
    this.totalTransactions = 0;
    this.totalPlazas = 0;
  }
  prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.updateFilteredSubTable();
  }
}

nextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.updateFilteredSubTable();
  }
}

updateDropdownLists() {
  const normalize = (val: any) => {
    if (val === null || val === undefined || val === '' || val === 'NULL') return '(No Value)';
    return String(val).trim();
  };

  // Filter data ikut pilihan plaza dan dropdown sedia ada supaya konsisten
  const filtered = this.allData.filter(row => {
    const plazaMatch = this.selectedPlaza && this.selectedPlaza.length
      ? this.selectedPlaza.includes(row.PlazaNo)
      : true;

    const codeMatch = this.selectedCodes && this.selectedCodes.length
      ? this.selectedCodes.includes(row.Code)
      : true;

    const penaltyMatch = this.selectedPenalties && this.selectedPenalties.length
      ? this.selectedPenalties.includes(row.PenaltyCode)
      : true;

    const remarkMatch = this.selectedRemarks && this.selectedRemarks.length
      ? this.selectedRemarks.includes(row.Remark)
      : true;

    return plazaMatch && codeMatch && penaltyMatch && remarkMatch;
  });

// Gunakan allData supaya dropdown tidak hilang
this.codeList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.Code)))).sort();
this.penaltyList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.PenaltyCode)))).sort();
this.remarkList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.Remark)))).sort();
this.paymentModeList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.PaymentMode)))).sort();


  this.logger.debug(' Updated Code List:', this.codeList);
  this.logger.debug(' Updated Penalty List:', this.penaltyList);
  this.logger.debug(' Updated Remark List:', this.remarkList);
  this.logger.debug(' Updated PaymentMode List:', this.paymentModeList);
}

  // ===== Helper function =====
  capitalizeName(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

      // ===== Role mapping =====
  roleLabelMap: Record<string, string> = {
    'proadmin': 'Super Admin',
    'admin': 'Admin',
    'user': 'executive'
  };


async downloadReport() {
  this.isDownloadingPDF = true; //  Start loading spinner
  this.progress = 0;
  // Interval untuk naikkan progress sikit demi sikit
  const interval = setInterval(() => {
    if (this.progress < 95) { // jangan penuh terus, tunggu API
      this.progress += 1;
    }
  }, 50); // setiap 50ms naik 1%

  await new Promise(resolve => setTimeout(resolve, 200)); // bagi masa overlay muncul

  try {
    const doc = new jsPDF('l', 'pt', 'a4');
    const marginX = 40;
    let currentY = 50;

  // === Title ===
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RFID/ABTC Analytics Report', marginX, currentY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  currentY += 25;
  doc.text(`Date: ${this.selectedDate || 'All Dates'}`, marginX, currentY);
  currentY += 15;
  const plazaText = Array.isArray(this.selectedPlaza)
    ? this.selectedPlaza.join(', ')
    : this.selectedPlaza || 'All Plazas';
  doc.text(`Plaza: ${plazaText}`, marginX, currentY);

  currentY += 25;
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, doc.internal.pageSize.getWidth() - marginX, currentY);

  // === Class x Entry Plaza Table (PINDAH KE ATAS) ===
  currentY += 20;
  if (this.dynamicClassPlaza?.length) {
    const entryPlazas = this.dynamicEntryPlazas;

    // === Header Level 1 ===
    const headRow1: any[] = [
      { content: 'Class', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ];
    entryPlazas.forEach((plaza) => {
      headRow1.push({
        content: `Entry Plaza ${plaza}`,
        colSpan: 2,
        styles: { halign: 'center', valign: 'middle' },
      });
    });
    headRow1.push(
      { content: 'Total Traffic', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Total Paid (RM)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
    );

    // === Header Level 2 ===
    const headRow2: any[] = [];
    entryPlazas.forEach(() => {
      headRow2.push(
        { content: 'Traffic', styles: { halign: 'center' } },
        { content: 'Paid (RM)', styles: { halign: 'center' } }
      );
    });

    // === Body ===
    const bodyRows = this.dynamicClassPlaza.map((row: any) => {
      const dataRow: any[] = [row.Class];
      entryPlazas.forEach((plaza) => {
        dataRow.push(
          row[`${plaza}_Traffic`] || 0,
          `RM ${(row[`${plaza}_Paid`] || 0).toFixed(2)}`
        );
      });
      dataRow.push(row.TotalTrafficAll || 0, `RM ${(row.TotalPaidAll || 0).toFixed(2)}`);
      return dataRow;
    });

    // === Total Row (SATU SAHAJA) ===
    const totalRow: any[] = ['Total'];
    entryPlazas.forEach((plaza) => {
      const sumTraffic = this.dynamicClassPlaza.reduce(
        (sum: number, r: any) => sum + (r[`${plaza}_Traffic`] || 0),
        0
      );
      const sumPaid = this.dynamicClassPlaza.reduce(
        (sum: number, r: any) => sum + (r[`${plaza}_Paid`] || 0),
        0
      );
      totalRow.push(sumTraffic, `RM ${sumPaid.toFixed(2)}`);
    });
    const totalTrafficAll = this.dynamicClassPlaza.reduce(
      (sum: number, r: any) => sum + (r.TotalTrafficAll || 0),
      0
    );
    const totalPaidAll = this.dynamicClassPlaza.reduce(
      (sum: number, r: any) => sum + (r.TotalPaidAll || 0),
      0
    );
    totalRow.push(totalTrafficAll, `RM ${totalPaidAll.toFixed(2)}`);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Class x Entry Plaza Summary', marginX, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [headRow1, headRow2],
      body: bodyRows,
      styles: { fontSize: 8, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [255, 152, 0], textColor: 0, halign: 'center', lineWidth: 0.1 },
      theme: 'grid',
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

  // === Overall Summary ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Overall Summary', marginX, currentY);

  const summaryData = [
    ['Total Transactions', this.totalTransactions || 0],
    ['Active Plazas', this.totalPlazas || 0],
    ['Total Paid', `RM ${this.totalPaid?.toFixed(2) || '0.00'}`],
  ];
  autoTable(doc, {
    startY: currentY + 10,
    head: [['Summary', 'Value']],
    body: summaryData,
    styles: { fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [33, 150, 243], halign: 'center' },
    theme: 'grid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 30;

  // === Entry Plaza Summary ===
  if (this.summaryData?.length) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Entry Plaza Summary', marginX, currentY);
    currentY += 10;
    autoTable(doc, {
      startY: currentY,
      head: [['Entry Plaza', 'Total']],
      body: this.summaryData.map((s: any) => [s.EntryPlaza, s.total]),
      styles: { fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [76, 175, 80], halign: 'center' },
      theme: 'grid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }

 /* // Moved Detailed Transactions section here (NEW PAGE)
  if (this.filteredSubTable?.length) {
    doc.addPage(); // halaman baru selepas Entry Plaza Summary
    currentY = 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detailed Transactions', marginX, currentY);
    currentY += 15;

    const detailHead = [[
      'No', 'TrxNo', 'PlazaNo', 'Lane', 'Date', 'Payment', 'Code',
      'Remark', 'TagID', 'Vehicle', 'Paid (RM)', 'Penalty', 'Trx'
    ]];

    const detailBody = this.filteredSubTable.map((tx: any, index: number) => [
      index + 1,
      tx.TrxNo || '-',
      tx.PlazaNo || '-',
      tx.LaneNo || '-',
      this.formatDate ? this.formatDate(tx.TransactionDateTime) : (tx.TransactionDateTime || '-'),
      tx.PaymentMode || '-',
      tx.Code || '-',
      tx.Remark || '-',
      tx.MfgNoTagID || '-',
      tx.VehicleNo || '-',
      (tx.PaidAmount || 0).toFixed(2),
      tx.PenaltyCode || '-',
      tx.Trx || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: detailHead,
      body: detailBody,
      styles: { fontSize: 8, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: 'grid',
      margin: { left: marginX, right: marginX },
      tableWidth: 'auto',
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;
  }
*/

  // === Graph Section ===
  const charts = [
    { id: 'chart-card-1', title: 'Entry Plaza (Total)' },
    { id: 'chart-card-2', title: 'Class (Total)' },
    { id: 'chart-card-3', title: 'Total Paid Amount (Plaza No)' },
  ];
  const maxWidth = 600;
  const maxHeight = 350;

  for (const chart of charts) {
    const chartElement = document.getElementById(chart.id) as HTMLElement;
    if (!chartElement) continue;

    const canvas = await html2canvas(chartElement, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    if (currentY + imgHeight + 50 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      currentY = 60;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(chart.title, marginX, currentY);
    currentY += 15;

    const pageWidth = doc.internal.pageSize.getWidth();
    const xCenter = (pageWidth - imgWidth) / 2;
    doc.addImage(imgData, 'PNG', xCenter, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 30;
  }



// === Footer ===
const totalPages = (doc as any).internal.getNumberOfPages();
const generatedDate = new Date().toLocaleString();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(100);

  const roleLabel = this.roleLabelMap[this.currentUser.role] || this.currentUser.role;

  const userInfo = `${this.capitalizeName(this.currentUser.name)} | ${this.currentUser.email} | ${roleLabel}`;
  const footerText = `Generated on ${generatedDate} | ${userInfo} | TNG Analytics Dashboard | Page ${i} of ${totalPages}`;

  doc.text(footerText, pageWidth - marginX, pageHeight - 20, { align: 'right' });
}



const selectedDateStr = this.selectedDate
  ? this.selectedDate.split('T')[0]
  : new Date().toISOString().split('T')[0];

// Pastikan payment mode dan plaza adalah string
const paymentModes = Array.isArray(this.selectedPaymentModes)
  ? this.selectedPaymentModes.join('-') || 'TNG'
  : this.selectedPaymentModes || 'TNG';

const plazas = Array.isArray(this.selectedPlaza)
  ? this.selectedPlaza.join('-') || 'AllPlazas'
  : this.selectedPlaza || 'AllPlazas';

// Bentuk nama fail dinamik
const fileName = `${paymentModes}_${selectedDateStr}_${plazas}.pdf`
  .replace(/\s+/g, '')         // buang ruang kosong
  .replace(/[^\w\-\.]/g, '');  // pastikan nama fail sah (no simbol pelik)

// Simpan PDF
doc.save(fileName);
    } catch (err) {
    this.logger.error(' Error generating PDF:', err);
  } finally {
    clearInterval(interval); // stop fake progress
    this.progress = 100;     // lengkapkan progress
    this.isDownloadingPDF = false; //  End loading spinner

}
}


updateClassSummary() {
  if (!this.filteredData || this.filteredData.length === 0) {
    this.classSummary = [];
    return;
  }

  // Group ikut AVC dan PaymentMode
  const summaryMap = new Map<string, { AVC: string; PaymentMode: string; Traffic: number; Revenue: number }>();

  this.filteredData.forEach((item: any) => {
    const key = `${item.AVC}_${item.PaymentMode}`;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        AVC: item.AVC || 'N/A',
        PaymentMode: item.PaymentMode || 'N/A',
        Traffic: 0,
        Revenue: 0
      });
    }
    const record = summaryMap.get(key)!;
    record.Traffic += 1;
    record.Revenue += parseFloat(item.PaidAmount) || 0;
  });

  const summaryArray = Array.from(summaryMap.values());

  // Jumlah keseluruhan
  const totalTraffic = summaryArray.reduce((sum, x) => sum + x.Traffic, 0);
  const totalRevenue = summaryArray.reduce((sum, x) => sum + x.Revenue, 0);

  // Simpan dalam variable untuk dipaparkan di HTML
  this.classSummary = summaryArray.map((x) => ({
    ...x,
    TotalTraffic: totalTraffic,
    TotalRevenue: totalRevenue
  }));
}

generateClassPlazaSummary(): { entryPlazas: string[]; summary: any[] } {
  if (!this.allData || !this.allData.length) {
    return { entryPlazas: [], summary: [] };
  }

  //  Dapatkan senarai unik EntryPlaza & Trx (bukan AVC)
  const entryPlazas = [...new Set(this.filteredData.map(d => d.EntryPlaza))].sort();
  const trxClasses = [...new Set(this.filteredData.map(d => d.Trx))].sort();

  const summary: any[] = [];

  trxClasses.forEach(cls => {
    const row: any = { Class: cls }; //  Guna Trx sebagai Class
    let totalTrafficAll = 0;
    let totalPaidAll = 0;

    entryPlazas.forEach(plaza => {
      const dataForCombo = this.filteredData.filter(
        d => d.EntryPlaza === plaza && d.Trx === cls
      );

      const totalTraffic = dataForCombo.length;
      const totalPaid = dataForCombo.reduce(
        (sum, d) => sum + (Number(d.PaidAmount) || 0),
        0
      );

      row[`${plaza}_Traffic`] = totalTraffic;
      row[`${plaza}_Paid`] = totalPaid;

      totalTrafficAll += totalTraffic;
      totalPaidAll += totalPaid;
    });

    row.TotalTrafficAll = totalTrafficAll;
    row.TotalPaidAll = totalPaidAll;
    summary.push(row);
  });

  //  Tambah baris total keseluruhan
  const totalRow: any = { Class: 'Total' };
  entryPlazas.forEach(plaza => {
    totalRow[`${plaza}_Traffic`] = summary.reduce(
      (sum, r) => sum + (r[`${plaza}_Traffic`] || 0),
      0
    );
    totalRow[`${plaza}_Paid`] = summary.reduce(
      (sum, r) => sum + (r[`${plaza}_Paid`] || 0),
      0
    );
  });

  totalRow.TotalTrafficAll = summary.reduce(
    (sum, r) => sum + (r.TotalTrafficAll || 0),
    0
  );
  totalRow.TotalPaidAll = summary.reduce(
    (sum, r) => sum + (r.TotalPaidAll || 0),
    0
  );

  summary.push(totalRow);

  return { entryPlazas, summary };
}

formatDate(date: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
resetTableFilters() {
  this.selectedCodes = [];
  this.selectedPenalties = [];
  this.selectedRemarks = [];

  // Reset current page
  this.currentPage = 1;

  // Reset filteredSubTable ikut allData
  this.filteredSubTable = this.allData.slice(0, this.pageSize);
}

}
