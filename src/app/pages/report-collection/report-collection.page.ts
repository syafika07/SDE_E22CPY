import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton,
  IonDatetime,
  IonNote, IonIcon, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { LoadingProgressComponent } from '../../components/loading-progress/loading-progress.component';
import { carOutline,cashOutline,trendingUpOutline,carSharp,carSportSharp,cashSharp } from 'ionicons/icons';
import { ROUTES } from '../../routes-map';
import { Router } from '@angular/router';

import { ViewChild, ElementRef } from '@angular/core';
import { SessionService } from 'src/app/services/session';
import { HeaderComponent } from 'src/app/components/header/header.component';


Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-report-collection',
  templateUrl: './report-collection.page.html',
  styleUrls: ['./report-collection.page.scss'],
  standalone: true,
  imports: [IonIcon, IonNote,
    CommonModule, FormsModule,
    IonContent, IonButton,
    LoadingProgressComponent, HeaderComponent
  ],
  providers: [DatePipe]
})
export class ReportCollectionPage implements OnInit {

  @ViewChild('trxDonutChart') donutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentModeChart') paymentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('plazaBarChart') plazaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trxClassBarChart') classCanvas!: ElementRef<HTMLCanvasElement>;


  // ================== COLOR MAP ==================

  plazaMap: Record<string, { name: string, color: string }> = {
    '201': { name: 'Senai', color: '#0077ff' },
    '202': { name: 'Ulu Tiram', color: '#eaff00' },
    '203': { name: 'Cahaya Baru', color: '#ff1900' },
    '204': { name: 'Penawar', color: '#39ff14' }
  };

  paymentColorMap: Record<string, string> = {
    'CSC': '#752b00',
    'ABT': '#8b4dff',
    'ABTC': 'rgb(36, 0, 182)',
    'TNG': '#ff8c00',
    'ENTRY': '#ff00ff',
    'RFID': '#00e5ff'
  };

  // Ionicon imports mapping jangan usik
  carOutline = carOutline;
  cashOutline = cashOutline;
  trendingUpOutline = trendingUpOutline;
  carSharp = carSharp;
  carSportSharp = carSportSharp;
  cashSharp =cashSharp;

  loading = false;

  startDate!: string;
  endDate!: string;

  plazaDonut: Chart | null = null;
  paymentDonut: Chart | null = null;
  plazaBar: Chart | null = null;
  classBar: Chart | null = null;


  selectedPlaza: string | null = null;
  selectedPayment: string | null = null;
  selectedTrx: string | null = null;

  latestDateMinusOne: string = '';
  totalPayment = 0;

  loadingProgress = 0;
  totalTraffic: number = 0;
  totalPaidAmount: number = 0;

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
    private router: Router,
    private session: SessionService
  ) {}

navigate(routeKey: keyof typeof ROUTES) {
  this.destroyAllCharts();
  const path = ROUTES[routeKey];
  if (path) this.router.navigate([path]);
}

destroyAllCharts() {

  const ids = [
    'trxDonutChart',
    'paymentModeChart',
    'plazaBarChart',
    'trxClassBarChart'
  ];

  ids.forEach(id => {
    const chart = Chart.getChart(id);
    if (chart) chart.destroy();
  });

  this.plazaDonut = null;
  this.paymentDonut = null;
  this.plazaBar = null;
  this.classBar = null;
}



  // ================== INIT ==================
ionViewDidEnter() {
  // Delay bagi DOM sempat render semula canvas
  setTimeout(() => {
    this.destroyAllCharts();
    this.reloadAll();
  }, 300); // 300-400ms biasanya cukup
}

ionViewWillLeave() {
}

/*
ngOnInit() {
  const today = new Date();
  const firstLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );

  this.startDate = this.datePipe.transform(firstLastMonth, 'yyyy-MM-dd')!;
  this.endDate = this.datePipe.transform(today, 'yyyy-MM-dd')!;

  // Latest date - 1 day
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  this.latestDateMinusOne = this.datePipe.transform(yesterday, 'yyyy-MM-dd')!;
}
  */
 ngOnInit() {
  const today = new Date();

  // Start date = 1st day of current month
  const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  this.startDate = this.datePipe.transform(firstDayCurrentMonth, 'yyyy-MM-dd')!;

  // End date = yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  this.endDate = this.datePipe.transform(yesterday, 'yyyy-MM-dd')!;

  this.latestDateMinusOne = this.endDate; // latest date minus 1
}
  // ================== PARAM BUILDER ==================

  buildParams(): HttpParams {
    let params = new HttpParams()
      .set('start_date', this.startDate)
      .set('end_date', this.endDate);

    if (this.selectedPlaza) params = params.set('plaza', this.selectedPlaza);
    if (this.selectedPayment) params = params.set('payment', this.selectedPayment);
    if (this.selectedTrx) params = params.set('trx', this.selectedTrx);

    return params;
  }

  // ================== MAIN RELOAD ==================

async reloadAll() {

  await new Promise(r => setTimeout(r, 200)); // tunggu DOM siap

  const fake = this.fakeProgress();

  await Promise.all([
    this.loadSummary(),
    this.loadPlazaDonut(),
    this.loadPaymentDonut(),
    this.loadPlazaBar(),
    this.loadClassBar()
  ]);

  await fake;

  this.loading = false;
  this.loadingProgress = 0;
}

  // ================== SUMMARY (PAYMENT) ==================

  loadSummary(): Promise<void> {
    return new Promise(resolve => {
      //this.http.get<any>('http://localhost:8000/summary', { params: this.buildParams() })
      this.http.get<any>('https://bkend-uim4.onrender.com/summary', { params: this.buildParams() })
        .subscribe(res => {
          if (res.status === 'success') {
            this.totalTraffic = res.totalTraffic;
            this.totalPaidAmount = res.totalPaidAmount;
          }
          resolve();
        });
    });
  }

  // ================== PLAZA DONUT ==================

  loadPlazaDonut(): Promise<void> {
    return new Promise(resolve => {

      //this.http.get<any>('http://localhost:8000/payment-per-plaza', {params: this.buildParams() })
      this.http.get<any>('https://bkend-uim4.onrender.com/payment-per-plaza', {params: this.buildParams() })
        .subscribe(res => {

          if (res.status === 'success') {

            const labels = res.chart_plaza.map((x: any) => x.PlazaNo);
            const data   = res.chart_plaza.map((x: any) => x.total_payment);

            this.renderPlazaDonut(labels, data);
          }

          resolve();
        });

    });
  }
renderPlazaDonut(labels: string[], data: number[]) {
  const existing = Chart.getChart('trxDonutChart');
  if (existing) existing.destroy();
  if (this.plazaDonut) this.plazaDonut.destroy();

  const ctx = this.donutCanvas.nativeElement.getContext('2d');
  if (!ctx) return;

  const displayColors = labels.map(l => this.plazaMap[l]?.color ?? '#dfe4ea');
  const total = data.reduce((sum, val) => sum + val, 0); // total for percentage

  this.plazaDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => this.plazaMap[l]?.name ?? l),
      datasets: [{
        data,
        backgroundColor: displayColors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#000',
          font: { weight: 'bold', size: 13 },
          formatter: (value) => {
            const percent = ((value / total) * 100).toFixed(2);
            return `${percent}%`; // show percentage on chart
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
           return `RM ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; // 2 decimal points
            }
          }
        }
      },
      onClick: (_, el) => {
        if (!el.length) return;
        const clicked = labels[el[0].index];
        this.selectedPlaza = this.selectedPlaza === clicked ? null : clicked;
        this.reloadAll();
      }
    },
    plugins: [ChartDataLabels] // make sure plugin is included
  });
}


  // ================== PAYMENT DONUT ==================

  loadPaymentDonut(): Promise<void> {
    return new Promise(resolve => {

      //this.http.get<any>('http://localhost:8000/payment-by-payment-mode', {params: this.buildParams()})
      this.http.get<any>('https://bkend-uim4.onrender.com/payment-by-payment-mode', {params: this.buildParams()})
        .subscribe(res => {

          if (res.status === 'success') {

            const labels = res.chart_payment.map((x: any) => x.PaymentMode);
            const data   = res.chart_payment.map((x: any) => x.total_payment);

            this.renderPaymentDonut(labels, data);
          }

          resolve();
        });

    });
  }

renderPaymentDonut(labels: string[], data: number[]) {

  // destroy chart lama tracked oleh Chart.js
  const existingChart = Chart.getChart('paymentModeChart');
  if (existingChart) existingChart.destroy();

  const ctx = this.paymentCanvas.nativeElement.getContext('2d');
  if (!ctx) return;

  const displayColors = labels.map(l => this.paymentColorMap[l] ?? '#dfe4ea');

  this.paymentDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: displayColors }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#000',
          font: { weight: 'bold', size: 12 },
          formatter: v =>
            'RM ' + Number(v).toLocaleString('en-MY', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
        },
                    tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
             return `RM ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
      },
      onClick: (_, el) => {
        if (!el.length) return;
        const clicked = labels[el[0].index];
        this.selectedPayment = this.selectedPayment === clicked ? null : clicked;
        this.reloadAll();
      }
    }
  });
}

  // ================== PLAZA BAR ==================

  loadPlazaBar(): Promise<void> {
    return new Promise(resolve => {

      //this.http.get<any>('http://localhost:8000/payment-by-plaza-bar', {params: this.buildParams() })
      this.http.get<any>('https://bkend-uim4.onrender.com/payment-by-plaza-bar', {params: this.buildParams() })
        .subscribe(res => {

          if (res.status === 'success') {

            const labels = res.chart_bar.map((x: any) => x.PlazaNo);
            const data   = res.chart_bar.map((x: any) => x.total_payment);

            this.renderPlazaBar(labels, data);
          }

          resolve();
        });

    });
  }

  renderPlazaBar(labels: string[], data: number[]) {
    const existing = Chart.getChart('plazaBarChart');
    if (existing) existing.destroy();

    if (this.plazaBar) this.plazaBar.destroy();

    const ctx = this.plazaCanvas.nativeElement.getContext('2d');

    if (!ctx) return;

    const displayColors =
      labels.map(l => this.plazaMap[l]?.color ?? '#0077ff');

    this.plazaBar = new Chart(ctx, {

      type: 'bar',

      data: {
        labels: labels.map(l => this.plazaMap[l]?.name ?? l),
        datasets: [{
          data,
          backgroundColor: displayColors
        }]
      },

      options: {
        responsive: true,

        plugins: {
          legend: { display: false },

          datalabels: {
            color: '#000000',
            offset: -4,
            font: { weight: 'bold', size: 12 },
            clip: false,
            formatter: v =>
              'RM ' + Number(v).toLocaleString('en-MY', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }),
            anchor: (context) => {
              const barValue = context.dataset.data[context.dataIndex] as number;
              const yScale = context.chart.scales['y'];
              const pixelTop = yScale.getPixelForValue(barValue);
              const pixelBottom = yScale.getPixelForValue(0);

              // kalau bar tinggi, anchor dalam bar ('center'), kalau pendek, atas ('end')
              return (pixelBottom - pixelTop) < 20 ? 'center' : 'end';
            },
            align: (context) => {
              const barValue = context.dataset.data[context.dataIndex] as number;
              const yScale = context.chart.scales['y'];
              const pixelTop = yScale.getPixelForValue(barValue);
              const pixelBottom = yScale.getPixelForValue(0);

              return (pixelBottom - pixelTop) < 20 ? 'center' : 'end';
            }
          },
            tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
             return `RM ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }

        },

        scales: {
          y: { beginAtZero: true }
        }

      },

      plugins: [ChartDataLabels]

    });
  }

  // ================== CLASS BAR ==================

  loadClassBar(): Promise<void> {
    return new Promise(resolve => {

      //this.http.get<any>('http://localhost:8000/payment-by-class', {params: this.buildParams()})
      this.http.get<any>('https://bkend-uim4.onrender.com/payment-by-class', {params: this.buildParams()})
        .subscribe(res => {

          if (res.status === 'success') {

            const labels =
              res.chart_class.map((x: any) => `Class ${x.Trx}`);

            const data =
              res.chart_class.map((x: any) => x.total_payment);

            this.renderClassBar(labels, data);
          }

          resolve();
        });

    });
  }

  renderClassBar(labels: string[], data: number[]) {
    const existing = Chart.getChart('trxClassBarChart');
    if (existing) existing.destroy();

    if (this.classBar) this.classBar.destroy();

    const ctx = this.classCanvas.nativeElement.getContext('2d');


    if (!ctx) return;

    this.classBar = new Chart(ctx, {

      type: 'bar',

      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#1e90ff'
        }]
      },

      options: {
        responsive: true,

        plugins: {
          legend: { display: false },

          datalabels: {
            color: '#000',
            anchor: 'end',
            align: 'end',
            offset: -4,
            font: { weight: 'bold', size: 12 },
            formatter: v =>
              'RM ' + Number(v).toLocaleString('en-MY', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }),
            clip: false
          },
            tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
             return `RM ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }

      },

      plugins: [ChartDataLabels]

    });
  }

  // ================== FAKE LOADING ==================

  fakeProgress(): Promise<void> {

    return new Promise(resolve => {

      this.loading = true;

      let progress = 0;

      const total = 3000;
      const interval = 100;
      const steps = total / interval;

      const inc = Math.ceil(99 / steps);

      const timer = setInterval(() => {

        progress += inc;

        if (progress >= 99) progress = 99;

        this.loadingProgress = progress;

        if (progress >= 99) {

          clearInterval(timer);

          resolve();
        }

      }, interval);

    });

  }

  // ================== RESET ==================

  resetFilter() {

    this.selectedPlaza = null;
    this.selectedPayment = null;
    this.selectedTrx = null;

    this.reloadAll();
  }
get isAuthenticated(): boolean {
  return this.session.isAuthenticated();
}

shouldShowReportHeader(): boolean {
  const currentUrl = this.router.url.split('?')[0];
  return this.session.isLoggedIn() &&
         currentUrl.startsWith(`/${ROUTES.REPORT_COLLECTION}`);
}
}
