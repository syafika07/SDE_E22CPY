import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton,
  IonDatetime,
  IonNote, IonDatetimeButton, IonModal, IonIcon } from '@ionic/angular/standalone';
import { LoadingProgressComponent } from '../../components/loading-progress/loading-progress.component';
import { carOutline,cashOutline,trendingUpOutline,carSharp,carSportSharp,cashSharp } from 'ionicons/icons';
import { ROUTES } from '../../routes-map';
import { Router } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';



Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonButton,
    IonDatetime, IonDatetimeButton,
    IonModal, IonIcon, IonNote,
    LoadingProgressComponent
],
  providers: [DatePipe]
})


export class ReportPage implements OnInit {
  @ViewChild('trxDonutChart') donutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentModeChart') paymentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('plazaBarChart') plazaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trxClassBarChart') classCanvas!: ElementRef<HTMLCanvasElement>;

  plazaMap: Record<string, { name: string, color: string }> = {
    '201': { name: 'Senai', color: '#0077ff' },
    '202': { name: 'Ulu Tiram', color: '#eaff00' },
    '203': { name: 'Cahaya Baru', color: '#ff1900' },
    '204': { name: 'Penawar', color: '#39ff14' }
  };

  paymentColorMap: Record<string, { name: string, color: string }> = {
    'CSC': { name: 'SmarTag', color:  '#752b00'},
    'ABT': { name: 'ABT', color: '#87172e'},
    'ABTC': { name: 'ABTC', color: 'rgb(122, 89, 255)'},
    'TNG': { name: 'TNG', color: '#ff8c00'},
    'ENTRY': { name: 'ENTRY', color: '#ff00ff'},
    'RFID': { name: 'RFID', color: '#00e5ff'}
  };

  // Ionicon imports mapping jangan usik
  carOutline = carOutline;
  cashOutline = cashOutline;
  trendingUpOutline = trendingUpOutline;
  carSharp = carSharp;
  carSportSharp = carSportSharp;
  cashSharp =cashSharp;

  loading: boolean = false;
  startDate!: string;
  endDate!: string;

  plazaDonut: Chart | null = null;
  paymentDonut: Chart | null = null;
  plazaBar: Chart | null = null;
  classBar: Chart | null = null;

  latestDateMinusOne: string = '';

  selectedPlaza: string | null = null;
  selectedPayment: string | null = null;
  selectedTrx: string | null = null;

  totalTraffic: number = 0;
  totalTrafficSegment: number = 0;
  totalPaidAmount: number = 0;
  loadingProgress: number = 0;
  totalSegment3: number = 0;

  segmentValues: { [key: string]: number } = {};
  segmentOrder = ['1','2','3','4','5','6','Total']; //,'2A' -spare

  segmentLabelMap: { [key: string]: string } = {
    '1': 'Segment 1',
    '2': 'Segment 2',
    //'2A': 'Segment 2A',

    '3': 'Segment 3',

    '4': 'Segment 4',

    '5': 'Segment 5',
    '6': 'Segment 6',
    'Total': 'Total'
  };
  totalSegment: number=0;

  constructor(private http: HttpClient, private datePipe: DatePipe, private router: Router) {}

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




ionViewDidEnter() {

  setTimeout(() => {

    this.destroyAllCharts();

    this.reloadAll();

  }, 400);

}

ionViewWillEnter() {
}



  buildParams(): HttpParams {
    let params = new HttpParams()
      .set('start_date', this.startDate)
      .set('end_date', this.endDate);

    if (this.selectedPlaza) params = params.set('plaza', this.selectedPlaza);
    if (this.selectedPayment) params = params.set('payment', this.selectedPayment);
    if (this.selectedTrx) params = params.set('trx', this.selectedTrx);

    return params;
  }

  // ---------------- Main Reload ----------------
async reloadAll() {

  await new Promise(r => setTimeout(r, 200)); // tunggu DOM siap

  const fake = this.fakeProgress();

  await Promise.all([
    this.loadSummary(),
    this.loadPlazaDonut(),
    this.loadPaymentDonut(),
    this.loadPlazaBar(),
    this.loadClassBar(),
    this.loadSegmentTraffic(),
    this.loadSegment3Traffic(),
    this.loadSegment6Traffic(),
    this.loadSegment4Traffic()
  ]).then(() => {
    this.calculateTotalTraffic(); // Total update di sini
  });

  await fake;

  this.loading = false;
  this.loadingProgress = 0;
}


  // ---------------- Summary ----------------
  loadSummary(): Promise<void> {
    return new Promise(resolve => {
      //this.http.get<any>('http://localhost:8000/summary', { params: this.buildParams() })
      this.http.get<any>('https://sde22-1.onrender.com/summary', { params: this.buildParams() })
          .subscribe(res => {
          if (res.status === 'success') {
            this.totalTraffic = res.totalTraffic;
            this.totalPaidAmount = res.totalPaidAmount;
          }
          resolve();
        });
    });
  }

  // ---------------- Plaza Donut ----------------
  loadPlazaDonut(): Promise<void> {
    return new Promise(resolve => {
      //this.http.get<any>('http://localhost:8000/trx-per-plaza', { params: this.buildParams() })
      this.http.get<any>('https://sde22-1.onrender.com/trx-per-plaza', { params: this.buildParams() })

        .subscribe(res => {
          if (res.status === 'success') {
            const labels = res.chart_plaza.map((x: any) => x.PlazaNo);
            const data = res.chart_plaza.map((x: any) => x.total_trx);
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
  const displayNames = labels.map(l => this.plazaMap[l]?.name ?? l);
  const total = data.reduce((sum, val) => sum + val, 0);

  this.plazaDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: displayNames, // nama mapping dari plazaMap
      datasets: [{ data, backgroundColor: displayColors }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fbfbfb', // <-- nama plaza hijau neon
            font: { weight: 'bold', size: 12 }
          }
        },
        datalabels: {
          color: '#000000', // angka % tetap hitam
          font: { weight: 'bold', size: 12 },
          formatter: (value) => ((value as number / total) * 100).toFixed(1) + '%'
        }
      },
      onClick: (_, el) => {
        if (!el.length) return;
        const clicked = labels[el[0].index];
        this.selectedPlaza = this.selectedPlaza === clicked ? null : clicked;
        this.reloadAll();
      }
    },
    plugins: [ChartDataLabels]
  });
}

  // ---------------- Payment Donut ----------------
  loadPaymentDonut(): Promise<void> {
    return new Promise(resolve => {
      //this.http.get<any>('http://localhost:8000/trx-by-payment-mode', { params: this.buildParams() })
      this.http.get<any>('https://sde22-1.onrender.com/trx-by-payment-mode', { params: this.buildParams() })

        .subscribe(res => {
          if (res.status === 'success') {
            const labels = res.chart_payment.map((x: any) => x.PaymentMode);
            const data = res.chart_payment.map((x: any) => x.total_trx);
            this.renderPaymentDonut(labels, data);
          }
          resolve();
        });
    });
  }

renderPaymentDonut(labels: string[], data: number[]) {

  const existing = Chart.getChart('paymentModeChart');
  if (existing) existing.destroy();
  if (this.paymentDonut) this.paymentDonut.destroy();

  const ctx = this.paymentCanvas.nativeElement.getContext('2d');
  if (!ctx) return;

  const displayColors: string[] = labels.map(
    l => this.paymentColorMap[l]?.color ?? '#dfe4ea'
  );
    const displayNames = labels.map(l => this.paymentColorMap[l]?.name ?? l);


  this.paymentDonut = new Chart(ctx, {
    type: 'doughnut',

    data: {
      labels: displayNames,
      datasets: [{
        data,
        backgroundColor: displayColors,
      }]
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fbfbfb',
            font: { weight: 'bold', size: 12 }
          }
        },

        datalabels: {
          color: '#000000',
          font: { weight: 'bold', size: 10 },
          formatter: (value) =>
            (value as number).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })
        }
      },

      onClick: (_, el) => {
        if (!el.length) return;

        const clicked = labels[el[0].index];

        this.selectedPayment =
          this.selectedPayment === clicked ? null : clicked;

        this.reloadAll();
      }
    }
  });
}


  // ---------------- Plaza Bar ----------------
  loadPlazaBar(): Promise<void> {
    return new Promise(resolve => {
      //this.http.get<any>('http://localhost:8000/trx-by-plaza-bar', { params: this.buildParams() })
      this.http.get<any>('https://sde22-1.onrender.com/trx-by-plaza-bar', { params: this.buildParams() })
        .subscribe(res => {
          if (res.status === 'success') {
            const labels = res.chart_bar.map((x: any) => x.PlazaNo);
            const data = res.chart_bar.map((x: any) => x.total_trx);
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

    let displayLabels = labels;
    let displayData = data;
    if (this.selectedPlaza) {
      const index = labels.indexOf(this.selectedPlaza);
      if (index !== -1) {
        displayLabels = [labels[index]];
        displayData = [data[index]];
      } else {
        displayLabels = [];
        displayData = [];
      }
    }

    const displayColors = displayLabels.map(l => this.plazaMap[l]?.color ?? '#0077ff');

    this.plazaBar = new Chart(ctx, {
      type: 'bar',
      data: { labels: displayLabels.map(l => this.plazaMap[l]?.name ?? l), datasets: [{ data: displayData, backgroundColor: displayColors }] },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: '#ffffff', // warna label putih supaya kelihatan dalam bar
            font: { weight: 'bold', size: 12 },
            clip: false,
            formatter: v => v.toLocaleString(),
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
                return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
              }
            }
          }
        },
          scales: {
            y: { beginAtZero: true },
            x: {
              ticks: {
                color: '#ffffff', // <-- warna label x axis
                font: { weight: 'bold', size: 12 } // optional, kalau nak tebal
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
      plugins: [ChartDataLabels]
    });
  }

  // ---------------- Class Bar ----------------
  loadClassBar(): Promise<void> {
    return new Promise(resolve => {
      //this.http.get<any>('http://localhost:8000/trx-by-class', { params: this.buildParams() })
      this.http.get<any>('https://sde22-1.onrender.com/trx-by-class', { params: this.buildParams() })
        .subscribe(res => {
          if (res.status === 'success') {
            const labels = res.chart_class.map((x: any) => `Class ${x.Trx}`);
            const data = res.chart_class.map((x: any) => x.total_trx);
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

    const displayColors = labels.map(l => l.includes(this.selectedTrx ?? '') ? '#1e90ff' : '#dfe4ea');

    this.classBar = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: displayColors }] },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          datalabels: { color: '#ffffff', anchor: 'end', align: 'end', font: { weight: 'bold', size: 12 },
          formatter: (value) => {
          return (value as number).toLocaleString(undefined, { maximumFractionDigits: 0 });}
          }
        },
            scales: {
            y: { beginAtZero: true },
            x: {
              ticks: {
                color: '#ffffff',
                font: { weight: 'bold', size: 12 }
              }
            }
          },
        onClick: (_, el) => {
          if (!el.length) return;
          const clicked = labels[el[0].index].replace('Class ', '');
          this.selectedTrx = this.selectedTrx === clicked ? null : clicked;
          this.reloadAll();
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // ---------------- Segment 1 & 2 (Total Entry & Exit) ----------------
loadSegmentTraffic(): Promise<void> {
  return new Promise(resolve => {
    this.http.get<any>('https://sde22-1.onrender.com/segment1-2', { params: this.buildParams() })
    //this.http.get<any>('http://localhost:8000/segment1-2', { params: this.buildParams() })
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.segmentValues['1'] = Number(res.totalTrafficSegment1) || 0;
            this.segmentValues['2'] = Number(res.totalTrafficSegment1) || 0;
            // Optional: update totalTraffic scoreboard if mahu
            //this.totalTrafficSegment = res.totalTrafficSegment1;
          }
          resolve();
        },
        error: (err) => {
          console.error('Error fetching total entry/exit:', err);
          resolve();
        }
      });
  });
}

  // ---------------- Segment 3 ----------------
loadSegment3Traffic(): Promise<void> {
  return new Promise(resolve => {

    this.http.get<any>('https://sde22-1.onrender.com/segment3', {params: this.buildParams()}).subscribe({
    //this.http.get<any>('http://localhost:8000/segment3', {params: this.buildParams()}).subscribe({


      next: (res) => {
        if (res.status === 'success') {

          // Simpan value segment 3
          this.segmentValues['3'] = Number(res.totalTrafficSegment3) || 0;

          // Optional kalau nak guna direct
          //this.totalSegment3 = res.totalTrafficSegment3;

        }
        resolve();
      },

      error: (err) => {
        console.error('Error fetching segment 3:', err);
        resolve();
      }

    });

  });
}
//------------------segment 4---------------

loadSegment4Traffic(): Promise<void> {
  return new Promise(resolve => {
    this.http.get<any>('https://sde22-1.onrender.com/segment4', { params: this.buildParams() })
    //this.http.get<any>('http://localhost:8000/segment4', { params: this.buildParams() })
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.segmentValues['4'] = Number(res.totalTrafficSegment4) || 0;
            // Optional: update totalTraffic scoreboard if mahu
            //this.totalTrafficSegment = res.totalTrafficSegment4;
          }
          resolve();
        },
        error: (err) => {
          console.error('Error fetching segment 4:', err);
          resolve();
        }
      });
  });
}
//---------------segemnt 5-6----------------
loadSegment6Traffic(): Promise<void> {
  return new Promise(resolve => {
    this.http.get<any>('https://sde22-1.onrender.com/segment6', { params: this.buildParams() })
    //this.http.get<any>('http://localhost:8000/segment6', { params: this.buildParams() })
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.segmentValues['6'] = Number(res.totalTrafficSegment6) || 0;
            this.segmentValues['5'] = Number(res.totalTrafficSegment6) || 0;

            // Optional: update totalTraffic scoreboard if mahu
            this.totalTrafficSegment = res.totalTrafficSegment6;
          }
          resolve();
        },
        error: (err) => {
          console.error('Error fetching total entry/exit:', err);
          resolve();
        }
      });
  });
}

calculateTotalTraffic(): void {
  this.segmentValues['Total'] = 0;

  const segmentsToSum = ['1', '3', '4', '6'];
  for (const key of segmentsToSum) {
    const value = this.segmentValues[key];
    if (value !== undefined && value !== null) {
      this.segmentValues['Total'] += Number(value) || 0;
    }
  }
}


  // ---------------- Fake Progress ----------------
fakeProgress(): Promise<void> {
  return new Promise(resolve => {
    this.loading = true;
    let progress = 0;

    const totalDuration = 3000;
    const intervalTime = 100;
    const steps = totalDuration / intervalTime;
    const increment = Math.ceil(99 / steps);

    const interval = setInterval(() => {
      progress += increment;
      if (progress >= 99) progress = 99;
      this.loadingProgress = progress;

      if (progress >= 99) {
        clearInterval(interval);
        resolve(); // selesai fake progress
      }
    }, intervalTime);
  });
}


  resetFilter() {
    this.selectedPlaza = null;
    this.selectedPayment = null;
    this.selectedTrx = null;
    this.reloadAll();
  }

getProgressWidth(value: number | undefined): number {
  if (!value) return 10;
  return Math.min(value / 100, 100);
}

}
