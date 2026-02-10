import { environment } from './../../../environments/environment';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { LoadingProgressComponent } from 'src/app/components/loading-progress/loading-progress.component';
import { SupabaseService } from 'src/app/services/supabase.service';
import { Router } from '@angular/router';

interface UploadCsvResponse {
  status: string;
  rows: number;
  message?: string;
  download?: string;
}

interface UploadPdfResponse {
  status: string;
  rows: number;
  csv_saved?: string;
  message?: string;
}

@Component({
  selector: 'app-upload-data',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, LoadingProgressComponent],
  templateUrl: './upload-data.page.html',
  styleUrls: ['./upload-data.page.scss'],
})
export class UploadDataPage {
  selectedFiles: File[] = [];
  pdfFiles: File[] = [];
  loading: boolean = false;
  progress: number = 0;
  //dashboardUrl = 'https://lookerstudio.google.com/...'; // ganti dengan URL sebenar
  dashboardRoute = '/dashboard';

  constructor(private http: HttpClient, private alertCtrl: AlertController, private router: Router) {}

  // ===== File Selection =====
  onFileSelected(event: any) {
    const files: File[] = Array.from(event.target.files);
    this.selectedFiles = files.filter(f => f.name.toLowerCase().endsWith('.csv'));
  }

  onPdfSelected(event: any) {
    const files: File[] = Array.from(event.target.files);
    this.pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  }

  // ===== Combined Upload =====
  async uploadAll() {
    if (!this.selectedFiles.length && !this.pdfFiles.length) return;

    this.loading = true;
    this.progress = 0;

    const interval = setInterval(() => {
      if (this.progress < 90) this.progress += 1;
    }, 50);

    try {
      // ===== CSV Upload =====
      if (this.selectedFiles.length) {
        const formDataCsv = new FormData();
        this.selectedFiles.forEach(file => formDataCsv.append('files', file, file.name));

        const csvRes = await this.http.post<UploadCsvResponse>('https://sde22-1.onrender.com/upload', formDataCsv).toPromise();
        //const csvRes = await this.http.post<UploadCsvResponse>('https://localhost:8000/upload', formDataCsv).toPromise();
        //const csvRes = await this.http.post<UploadCsvResponse>( `${environment.apiUrl}/upload`, formDataCsv).toPromise();


        const alertCsv = await this.alertCtrl.create({
          header: 'CSV Upload Result',
          message: csvRes?.status === 'success'
            ? `${csvRes.rows} new records uploaded successfully.`
            : csvRes?.message || 'Error processing CSV.',
          buttons: ['OK']
        });
        await alertCsv.present();

        // Download CSV if available
        if (csvRes?.download) {
          const link = document.createElement('a');
          link.href = csvRes.download;
          link.download = 'filtered_new_rows.csv';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      // ===== PDF Upload =====
      if (this.pdfFiles.length) {
        const formDataPdf = new FormData();
        this.pdfFiles.forEach(file => formDataPdf.append('files', file, file.name));

        const pdfRes = await this.http.post<UploadPdfResponse>('https://sde22-1.onrender.com/upload-pdf', formDataPdf).toPromise();
        //const pdfRes = await this.http.post<UploadPdfResponse>('https://sde22-1.onrender.com/upload-pdf', formDataPdf).toPromise();
        const csvRes = await this.http.post<UploadCsvResponse>( `${environment.apiUrl}/upload`, formDataPdf).toPromise();

        const alertPdf = await this.alertCtrl.create({
          header: 'PDF Upload Result',
          message: pdfRes?.status === 'success'
            ? `${pdfRes.rows} rows inserted. CSV saved at: ${pdfRes.csv_saved || 'N/A'}`
            : pdfRes?.message || 'Error processing PDF.',
          buttons: ['OK']
        });
        await alertPdf.present();

        // Download CSV if available
        if (pdfRes?.csv_saved) {
          const link = document.createElement('a');
          link.href = pdfRes.csv_saved;
          link.download = 'filtered_new_rows.csv';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

    } catch (err: any) {
      const alert = await this.alertCtrl.create({
        header: 'Upload Error',
        message: err.message || 'Server unreachable',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      clearInterval(interval);
      this.progress = 100;
      setTimeout(() => {
        this.progress = 0;
        this.loading = false;
      }, 300);
    }
  }

  openDashboard() {
    // Navigate ke dashboard page
    this.router.navigate([this.dashboardRoute]);
  }
}
