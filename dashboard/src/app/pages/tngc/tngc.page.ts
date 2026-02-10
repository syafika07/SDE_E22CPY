
/////////////////////////////////////////

  import { Component, OnInit } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { IonicModule } from '@ionic/angular';
  import { CommonModule } from '@angular/common';
  import { Chart, registerables } from 'chart.js';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import html2canvas from 'html2canvas';
  import { HeaderComponent } from 'src/app/components/header/header.component';
  import { FormsModule } from '@angular/forms';
  import { SupabaseService } from 'src/app/services/supabase.service';
  import { NGXLogger } from 'ngx-logger';
  import { SessionService } from 'src/app/services/session';
  import { LoadingProgressComponent } from './../../components/loading-progress/loading-progress.component';
import { environment } from './../../../environments/environment';






  Chart.register(ChartDataLabels);
  Chart.register(...registerables);
  // ===== Interface untuk setiap rekod TNG =====
  interface TngRecord {
    TrxNo: string;
    PlazaNo: string;
    LaneNo: string;
    EntryPlaza: string;
    TransactionDateTime: string;
    PaymentMode: string;
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
    OriginPlaza?: string | null;
    CardNo?: string | null;
    id: number;
  }

  declare module 'jspdf' {
    interface jsPDF {
      lastAutoTable: any;
    }
  }


  @Component({
    selector: 'app-tngc',
    templateUrl: './tngc.page.html',
    styleUrls: ['./tngc.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, LoadingProgressComponent],

  })
  export class TngPagec implements OnInit {

    // DI LETAK DI DALAM class TngPagec { ... }
  fareTable: any = {
    "1": { // Class 1
      "201": { "202": 4.50, "203": 9.20, "204": 13.50 },
      "202": { "201": 4.50, "203": 5.60, "204": 9.90 },
      "203": { "201": 9.20, "202": 5.60, "204": 7.20 },
      "204": { "201": 13.50, "202": 9.90, "203": 7.20 }
    },
    "2": { // Class 2
      "201": { "202": 6.80, "203": 13.80, "204": 20.20 },
      "202": { "201": 6.80, "203": 8.50, "204": 14.90 },
      "203": { "201": 13.80, "202": 8.50, "204": 10.80 },
      "204": { "201": 20.20, "202": 14.90, "203": 10.80 }
    },
    "3": { // Class 3
      "201": { "202": 9.00, "203": 18.40, "204": 27.00 },
      "202": { "201": 9.00, "203": 11.30, "204": 19.90 },
      "203": { "201": 18.40, "202": 11.30, "204": 14.40 },
      "204": { "201": 27.00, "202": 19.90, "203": 14.00 }
    },
    "4": { // Class 4 (Taxi)
      "201": { "202": 2.30, "203": 4.60, "204": 6.80 },
      "202": { "201": 2.30, "203": 2.80, "204": 5.00 },
      "203": { "201": 4.60, "202": 2.80, "204": 3.60 },
      "204": { "201": 6.80, "202": 5.00, "203": 3.60 }
    },
    "5": { // Class 5 (Bus)
      "201": { "202": 2.80, "203": 5.70, "204": 8.40 },
      "202": { "201": 2.80, "203": 3.50, "204": 6.20 },
      "203": { "201": 5.70, "202": 3.50, "204": 4.50 },
      "204": { "201": 8.40, "202": 6.20, "203": 4.50 }
    }
  };

        currentUser = {
      name: '',
      email: '',
      role: ''
    };

    userName: string = '';
    userEmail: string = '';
  private normalizeValue(v: any, keepNullString = false): string {
    if (v === null || v === undefined) return keepNullString ? '-' : '';
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '-') return keepNullString ? '-' : '';
      return t;
    }
    return String(v);
  }


    // ======= Data =======
    allData: TngRecord[] = [];
    filteredData: TngRecord[] = [];
    summaryData: any[] = [];
    plazaList: string[] = [];
    originalPlazaList: string[] = [];
    penaltyCodeList: string[] = [];
    selectedPenaltyCode: string = '';
    allPlazaList: string[] = [];
    selectedCode: string = '';
    selectedPenalty: string = '';
    selectedRemark: string = '';
    classSummary: any[] = [];
  selectedPlaza: any = [];
  selectedPaymentModes: string[] = [];
    entryPlazas: string[] = [];
    trafficSummaryData: any[] = [];
  selectedClasses: string[] = [];
  selectedTrx: string[] = [];  // <--- ini yang hilang
  trxList: string[] = [];
    filteredSubTable: any[] = [];
    codeList: string[] = [];
    penaltyList: string[] = [];
    remarkList: string[] = [];
    filteredDataAfterFilter: TngRecord[] = [];
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
entryPlazaOptions: string[] = ['201','202','203','204'];
// Track jika table sedang edit
isEditing: boolean = false;

// Track rows yang diubah
updatedRows: any[] = [];
// Tambah DI ATAS constructor (dalam class definition)
private masterPlazaList: string[] = [];
private masterPaymentModeList: string[] = [];
private masterCodeList: string[] = [];
private masterPenaltyList: string[] = [];
private masterRemarkList: string[] = [];
private masterTrxList: string[] = [];
// ————— DI DALAM class TngPagec { —————
private currentMasterDate: string | null = null;  // ← TAMBAH INI

    pageSize = 100;
    currentPage = 1;
    totalPages = 1;


    loading = false;

    totalPaid: number = 0;
    totalTransactions: number = 0;
    totalPlazas: number = 0;

    barChart1: any;
    donutChart: any;
    barChart2: any;

  private apiUrl = 'https://sde22-1.onrender.com/wtng';
  //private apiUrl = `${environment.apiUrl}/wtng`;
  //private apiUrl = 'http://localhost:8000/wtng';
  //private apiUrl = 'http://172.30.0.112:8000/wtng';



    selectedDate: string = '';

    constructor(private http: HttpClient,private supabaseService: SupabaseService,private logger: NGXLogger) {
      this.logger.debug('AppComponent initialized');
  }

  async ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;
    this.applyFilter();

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
  this.loading = true;
  this.progress = 0;

  const interval = setInterval(() => {
    if (this.progress < 95) this.progress += 1;
  }, 50);

  // ✅ Tentukan sama ada perlu fetch master (tarikh berubah)
  const shouldFetchMaster = this.currentMasterDate !== this.selectedDate;

  // ✅ Params untuk filtered data (sentiasa digunakan)
  const filteredParams: any = { start_date: this.selectedDate };

  if (Array.isArray(this.selectedPlaza) && this.selectedPlaza.length > 0) {
    filteredParams.plazas = this.selectedPlaza.join(',');
  }
  if (Array.isArray(this.selectedPaymentModes) && this.selectedPaymentModes.length > 0) {
    filteredParams.payment_modes = this.selectedPaymentModes.join(',');
  }

  // 🔁 Jika tarikh baru, fetch SEMUA data dulu (untuk populate master lists)
  if (shouldFetchMaster) {
    const masterParams: any = { start_date: this.selectedDate };

    this.http.get<any>(this.apiUrl, { params: masterParams }).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          const allRawData = Array.isArray(res.data) ? res.data : [];
        // ✅ Code yang betul (100% type-safe)
        const extractStrings = (fieldKey: keyof TngRecord): string[] => {
          const values: string[] = allRawData
            .map((d: TngRecord) => this.normalizeValue(d[fieldKey]))
            .filter((v: string) => v.trim() !== '');
          return [...new Set(values)].sort();
        };

          this.masterPlazaList = extractStrings('PlazaNo');
          this.masterPaymentModeList = extractStrings('PaymentMode');
          this.masterCodeList = extractStrings('Code');
          this.masterPenaltyList = extractStrings('PenaltyCode');
          this.masterRemarkList = extractStrings('Remark');
          this.masterTrxList = extractStrings('Trx');

          // ✅ Assign ke UI lists
          this.plazaList = [...this.masterPlazaList];
          this.paymentModeList = [...this.masterPaymentModeList];
          this.codeList = [...this.masterCodeList];
          this.penaltyList = [...this.masterPenaltyList];
          this.remarkList = [...this.masterRemarkList];
          this.trxList = [...this.masterTrxList];

          this.currentMasterDate = this.selectedDate;
          this.originalPlazaList = [...this.masterPlazaList];
          this.totalPlazas = this.masterPlazaList.length;

          // ✅ Sambung ke fetch filtered
          this.fetchFilteredData(filteredParams, interval);
        } else {
          clearInterval(interval);
          this.progress = 100;
          this.loading = false;
          this.resetData();
        }
      },
      error: (err) => {
        clearInterval(interval);
        this.progress = 100;
        this.loading = false;
        this.logger.error('❌ Error fetching master ', err);
        this.resetData();
      }
    });
  } else {
    // ✅ Tarikh sama — terus fetch filtered data
    this.fetchFilteredData(filteredParams, interval);
  }
}

// ✅ Helper: fetch data mengikut filter semasa
private fetchFilteredData(params: any, interval: any) {
  this.http.get<any>(this.apiUrl, { params }).subscribe({
    next: (res) => {
      clearInterval(interval);
      this.progress = 100;
      this.loading = false;

      if (res.status === 'success') {
        // ✅ Mapping filtered data untuk table/chart
        this.allData = (res.data || []).map((d: any) => ({
          TrxNo: this.normalizeValue(d.TrxNo, true),
          PlazaNo: this.normalizeValue(d.PlazaNo, true),
          EntryPlaza: this.normalizeValue(d.EntryPlaza, true),
          id: d.id,
          OriginPlaza: this.normalizeValue(d.OriginPlaza, true),
          CardNo: this.normalizeValue(d.CardNo, true),
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

        // ✅ Update UI berdasarkan filtered data
        this.filterData();
        this.calculateSummaryMetrics();
        this.updateSummaryTable();
        this.updateCharts();
        this.applyTableFilter();
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
      clearInterval(interval);
      this.progress = 100;
      this.loading = false;
      this.logger.error('❌ Error fetching filtered data:', err);
      this.resetData();
    }
  });
}
    filterData() {
    const normalize = (val: any) => {
      if (val === null || val === undefined || val === '' || val === '-') return '(No Value)';
      return String(val).trim();
    };

    let data = [...this.allData];

    if (this.selectedPlaza && this.selectedPlaza.length > 0) {
      data = data.filter(d => this.selectedPlaza.includes(normalize(d.PlazaNo)));
    }

    if (this.selectedPenaltyCode && this.selectedPenaltyCode !== '') {
      data = data.filter(d => normalize(d.PenaltyCode) === normalize(this.selectedPenaltyCode));
    }

    data.sort((a, b) => new Date(b.TransactionDateTime).getTime() - new Date(a.TransactionDateTime).getTime());

    this.filteredData = data;

    this.updateClassSummary();
  }


  onPlazaChange() {
    this.filterData();

    this.applyTableFilter();

    this.refreshDashboard();
  }

  onPenaltyChange() {
    this.filterData();

    this.applyTableFilter();

    this.refreshDashboard();
  }

  refreshDashboard() {
    this.calculateSummaryMetrics();
    this.updateSummaryTable();
    this.updateCharts();
    this.updateFilteredSubTable();
  }



    calculateSummaryMetrics() {
      this.totalTransactions = this.filteredData.length;
      this.totalPaid = this.filteredData.reduce((sum, d) => sum + (Number(d.PaidAmount) || 0), 0);
    }



// Update function slice ikut filtered data
updateFilteredSubTable() {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;

  // ✅ Shallow copy setiap row
  this.filteredSubTable = this.filteredDataAfterFilter.slice(start, end).map(row => ({
    ...row
  }));

  this.totalPages = Math.ceil(this.filteredDataAfterFilter.length / this.pageSize);
}

applyTableFilter() {
  // ✅ Normalize selected filter arrays
  const selectedTrxNorm = this.selectedTrx.map(v => this.normalizeValue(v));
  const selectedPenaltiesNorm = this.selectedPenalties.map(v => this.normalizeValue(v));
  const selectedRemarksNorm = this.selectedRemarks.map(v => this.normalizeValue(v));
  const selectedPaymentModesNorm = this.selectedPaymentModes.map(v => this.normalizeValue(v));

  // Filter data dari allData (bukan filteredData)
  this.filteredDataAfterFilter = this.allData.filter(row => {
    const trxVal = this.normalizeValue(row.Trx);
    const penaltyVal = this.normalizeValue(row.PenaltyCode);
    const remarkVal = this.normalizeValue(row.Remark);
    const paymentVal = this.normalizeValue(row.PaymentMode);

    const trxMatch = selectedTrxNorm.length ? selectedTrxNorm.includes(trxVal) : true;
    const penaltyMatch = selectedPenaltiesNorm.length ? selectedPenaltiesNorm.includes(penaltyVal) : true;
    const remarkMatch = selectedRemarksNorm.length ? selectedRemarksNorm.includes(remarkVal) : true;
    const paymentMatch = selectedPaymentModesNorm.length ? selectedPaymentModesNorm.includes(paymentVal) : true;

    return trxMatch && penaltyMatch && remarkMatch && paymentMatch;
  });

  // Update pagination
  this.totalPages = Math.ceil(this.filteredDataAfterFilter.length / this.pageSize);
  if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  if (this.currentPage < 1) this.currentPage = 1;

  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;

  // ✅ Assign shallow copy ke filteredSubTable — BREAK REFERENCE!
  this.filteredSubTable = this.filteredDataAfterFilter.slice(start, end).map(row => ({
    ...row // ← shallow copy: setiap row baru, bukan reference
  }));
}


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

  updateCharts() {
    this.createBarChart1();
    this.createDonutChart();
    this.createBarChart2();
  }

createBarChart1() {
  const ctx = document.getElementById('barChart1') as HTMLCanvasElement;
    if (!ctx) return;

  if (this.barChart1) {
    this.barChart1.destroy();
    this.barChart1 = null;
  }

  const grouped = this.groupByCount(this.filteredData, 'EntryPlaza');
  const labels = Object.keys(grouped);
  const data = Object.values(grouped);

  const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, ctx.height);
  gradient.addColorStop(0.5, '#007feeff');
  gradient.addColorStop(1, '#00d5ffff');

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
  if (!ctx) return;
  if (this.barChart2) {
    this.barChart2.destroy();
    this.barChart2 = null;
  }

  if (!this.selectedPlaza || this.selectedPlaza.length === 0) return;

  // Group data by 'Trx' untuk setiap plaza
  const labels = Array.from(new Set(this.filteredData.map(d => d.Trx)));

  // Siapkan datasets untuk setiap plaza
  const datasets = this.selectedPlaza.map((plaza: string, i: number) => {
    const data = labels.map(label => {
      const filtered = this.filteredData.filter(d => d.Trx === label && d.PlazaNo === plaza);
      return filtered.length;
    });

    // Gradient berbeza untuk setiap plaza
    const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, ctx.height);
    gradient.addColorStop(0, `hsl(${(i * 60) % 360}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${(i * 60) % 360}, 70%, 30%)`);

    return {
      label: plaza,
      data,
      backgroundColor: gradient,
      borderRadius: 0, // pastikan segi empat
    };
  });

  // Cari nilai maksimum untuk scale Y
  const allValues = datasets.reduce((acc: string | any[], d: { data: any; }) => acc.concat(d.data), [] as number[]);
  const maxValue = Math.max(...allValues) + 1000;

  this.barChart2 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          anchor: 'end',
          align: 'end',
          rotation: -50, // nombor serong
          offset: 4, // jarak dari atas bar
          formatter: (value: number) => value,
          font: { size: 10 },
          color: '#000000', // warna hitam

        }
      },
      scales: {
        x: {
          stacked: false
        },
        y: {
          beginAtZero: true,
          max: maxValue
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}



getColor(index: number): string {
  const colors = [
    '#0071a9ff', '#50ffc2ff', '#ffa600', '#ef5675',
    '#8c564b', '#bc5090', '#003f5c', '#665191'
  ];
  return colors[index % colors.length];
}

createDonutChart() {
  const ctx = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!ctx) return;

  if (this.donutChart) {
    this.donutChart.destroy();
    this.donutChart= null;
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
          '#00FFFF',
          '#00CED1',
          '#40E0D0',
          '#48D1CC',
          '#20B2AA'
        ],
        borderColor: '#fff',
        borderWidth: 1
      }],
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          color: '#000000ff',
          font: { size: 9 },
          formatter: (value: any, context: any) => {
            return 'RM ' + Number(value).toFixed(2);
          },
          anchor: 'center',
          align: (context: any) => {
            const value = context.dataset.data[context.dataIndex];
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            return value / total > 0.05 ? 'center' : 'end';
          },
          clamp: true
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

groupByCount(data: any[], key: string): any {
  const result: any = {};
  data.forEach((row) => {
    let k = row[key];
    if (k === '' || k === null || k === undefined) k = '-';
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

resetData() {
  // ✅ Kosongkan SEMUA lists & data
  this.allData = [];
  this.filteredData = [];
  this.filteredDataAfterFilter = [];
  this.filteredSubTable = [];

  // ✅ Kosongkan master & UI lists
  this.masterPlazaList = [];
  this.masterPaymentModeList = [];
  this.masterCodeList = [];
  this.masterPenaltyList = [];
  this.masterRemarkList = [];
  this.masterTrxList = [];

  this.plazaList = [];
  this.paymentModeList = [];
  this.codeList = [];
  this.penaltyList = [];
  this.remarkList = [];
  this.trxList = [];

  // ✅ Reset selected
  this.selectedPlaza = [];
  this.selectedPaymentModes = [];
  this.selectedTrx = [];
  this.selectedPenalties = [];
  this.selectedRemarks = [];

  // ✅ Reset metrics
  this.totalPaid = 0;
  this.totalTransactions = 0;
  this.totalPlazas = 0;
  this.summaryData = [];
  this.dynamicClassPlaza = [];
  this.dynamicEntryPlazas = [];
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
  // ✅ Hanya set master lists sekali
  if (this.masterCodeList.length === 0) {
    this.masterCodeList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.Code)))).filter(v => v).sort();
  }
  if (this.masterPenaltyList.length === 0) {
    this.masterPenaltyList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.PenaltyCode)))).filter(v => v).sort();
  }
  if (this.masterRemarkList.length === 0) {
    this.masterRemarkList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.Remark)))).filter(v => v).sort();
  }
  if (this.masterTrxList.length === 0) {
    this.masterTrxList = Array.from(new Set(this.allData.map(d => this.normalizeValue(d.Trx)))).filter(v => v).sort();
  }

  // Assign ke UI lists (boleh di-override jika perlu, tapi biasanya kekal master)
  this.codeList = [...this.masterCodeList];
  this.penaltyList = [...this.masterPenaltyList];
  this.remarkList = [...this.masterRemarkList];
  this.trxList = [...this.masterTrxList];
}



  capitalizeName(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

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
  ? this.selectedPaymentModes.join('-') || 'AllPaymentModes'
  : this.selectedPaymentModes || 'AllPaymentModes';

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

  // Dapatkan senarai unik EntryPlaza & Trx (bukan AVC)
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

  // Tambah baris total keseluruhan
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
  this.selectedTrx = [];
  this.selectedPenalties = [];
  this.selectedRemarks = [];
  this.selectedPaymentModes = [];
  this.currentPage = 1;

  const start = 0;
  const end = this.pageSize;

  // ✅ Shallow copy
  this.filteredSubTable = this.allData.slice(start, end).map(row => ({
    ...row
  }));

  this.totalPages = Math.ceil(this.allData.length / this.pageSize);
}


togglePaymentMode(pm: string, event: any) {
  if (event.detail.checked) {
    if (!this.selectedPaymentModes.includes(pm)) {
      this.selectedPaymentModes.push(pm);
    }
  } else {
    this.selectedPaymentModes = this.selectedPaymentModes.filter(x => x !== pm);
  }

}

toggleSelectAllPaymentModes(event: any) {
  if (event.detail.checked) {
    this.selectedPaymentModes = [...this.paymentModeList];
  } else {
    this.selectedPaymentModes = [];
  }
}

// Computed property untuk title
get trafficRevenueTitle(): string {
  let parts: string[] = [];

  if (this.selectedPaymentModes.length) {
    parts.push(this.selectedPaymentModes.join(', '));
  }
  if (this.selectedPlaza.length) {
    parts.push(this.selectedPlaza.join(', '));
  }
  if (this.selectedDate) {
    parts.push(this.selectedDate);
  }

  return parts.length
    ? `Traffic And Revenue By Origin Plaza (${parts.join(' | ')})`
    : 'Traffic And Revenue By Origin Plaza';
}

onEntryPlazaChange(row: any) {
  // ✅ Auto-tambah "EDITED!!" ke Remark semasa edit (untuk UI & audit)
  if (row && !row.Remark?.includes("EDITED!!")) {
    row.Remark = (row.Remark || "").trim()
      ? `${row.Remark} EDITED!!`
      : "EDITED!!";
  }

  // Masukkan ke updatedRows jika belum ada
  const exists = this.updatedRows.find(r => r.id === row.id);
  if (!exists) {
    this.updatedRows.push(row);
  }
}


toggleEdit() {
  this.isEditing = !this.isEditing;

  // Kalau cancel edit, reset updatedRows
  if (!this.isEditing) {
    this.updatedRows = [];
  }
}
getAvailablePlazas(currentValue: string) {
  return this.entryPlazaOptions.filter(p => p !== currentValue);
}
async saveChanges() {
  this.isLoading = true;

  try {
    for (let row of this.updatedRows) {
      await this.supabaseService.updateTransactionInDB(row);

      // Sync updated row ke allData
      const index = this.allData.findIndex(r => r.id === row.id);
      if (index > -1) {
        this.allData[index] = { ...this.allData[index], ...row };
      }
    }

    // Refresh filteredSubTable ikut filter & pagination
    this.applyTableFilter();

    // Clear updatedRows
    this.updatedRows = [];

  } catch (err) {
    console.error('Save changes failed', err);
  } finally {
    this.isLoading = false;
  }
}

isRowEditable(row: any): boolean {
  if (!this.isEditing) return false;

  const remark = row.Remark?.toString() || "";
  const entry = row.EntryPlaza;

  const isNull = (entry === null || entry === 'NULL' || entry === '' || entry === undefined);

  const hasEdited = remark.includes("EDITED!!");

  // RULE:
  // 1) Kalau NULL atau "NULL" → BOLEH EDIT
  // 2) Kalau ada remark EDITED!! → BOLEH EDIT
  if (isNull || hasEdited) {
    return true;
  }

  return false;
}
onDateChange() {
  // ✅ 1. Kosongkan SEMUA selected filters
  this.selectedPlaza = [];
  this.selectedPaymentModes = [];
  this.selectedTrx = [];
  this.selectedPenalties = [];
  this.selectedRemarks = [];

  // ✅ 2. Kosongkan dropdown lists (untuk elak "stale options")
  this.plazaList = [];
  this.paymentModeList = [];
  this.codeList = [];
  this.penaltyList = [];
  this.remarkList = [];
  this.trxList = [];

  // ✅ 3. Reset table & pagination
  this.currentPage = 1;
  this.filteredSubTable = [];
  this.updatedRows = [];
  this.isEditing = false;

  // ✅ 4. Fetch data baharu
  this.applyFilter();
}
// ————— DI DALAM class TngPagec { —————
trackByRow(index: number, row: any): number {
  return row.id; // guna id sebagai unique key
}


}
