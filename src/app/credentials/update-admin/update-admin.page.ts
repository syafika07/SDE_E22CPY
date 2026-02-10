import { ROUTES } from './../../routes-map';
import { Component, OnInit } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { HeaderComponent } from "src/app/components/header/header.component";
import { NGXLogger } from 'ngx-logger';
import {
  IonContent,
  IonSpinner,
  IonSelect,
  IonSelectOption, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-update-admin',
  standalone: true,
  imports: [
    HeaderComponent,
    ReactiveFormsModule,
    IonContent,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    CommonModule

  ],
  templateUrl: './update-admin.page.html',
  styleUrls: ['./update-admin.page.scss']
})
export class UpdateAdminPage implements OnInit {
  users: any[] = [];
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
    private logger: NGXLogger

  ) {
    this.logger.debug('AppComponent initialized');
}

  async ngOnInit() {
    this.loading = true;

    this.supabaseService.user$.subscribe(async (supabaseUser) => {
      if (!supabaseUser) {
        this.showToast('Sila login terlebih dahulu', 'danger');
        this.router.navigateByUrl(ROUTES.LOGIN);
        return;
      }

      const profile = await this.supabaseService.getProfile(supabaseUser.id);
      if (!profile || profile.role !== 'proadmin') {
        this.showToast('Akses ditolak. Hanya Pro Admin dibenarkan.', 'danger');
        this.router.navigateByUrl(ROUTES.LOGIN);
        this.loading = false;
        return;
      }

      await this.loadUsers();
    });
  }


  async loadUsers() {
    this.loading = true;
    const { data, error } = await this.supabaseService.getAllUsers();
    this.users = error ? [] : data ?? [];
    this.loading = false;
  }

  async updateRole(user: any, newRole: string) {
    try {
      await this.supabaseService.updateUserRole(user.id, { role: newRole });
      user.role = newRole;
      this.showToast(`Role ${user.email} berjaya dikemas kini`);
    } catch (err) {
      this.logger.error(err);
      this.showToast(`Gagal kemas kini role ${user.email}`, 'danger');
    }
  }

  async editUser(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'Kemaskini Info User',
      inputs: [
        { name: 'email', type: 'email', placeholder: 'Email', value: user.email },
        { name: 'name', type: 'text', placeholder: 'Nama', value: user.name },
        { name: 'password', type: 'password', placeholder: 'Password Baru (kosong jika tidak tukar)' }
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        { text: 'Simpan', handler: async (values) => await this.updateUserInfo(user, values) }
      ]
    });
    await alert.present();
  }

  async updateUserInfo(user: any, values: any) {
    try {
      await this.supabaseService.updateFullUser(user.id, {
        email: values.email,
        name: values.name,
        role: user.role
      });

      if (values.password) {
        const response = await fetch(
          'https://uonphwbbgemsvqzrdcwp.supabase.co/functions/v1/update-password',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, newPassword: values.password })
          }
        );
        const result = await response.json();
        if (result.error) throw new Error(result.error);
      }

      user.email = values.email;
      user.name = values.name;

      this.showToast('User info berjaya dikemas kini');
    } catch (err: any) {
      this.logger.error(err);
      this.showToast('Gagal kemas kini user: ' + err.message, 'danger');
    }
  }

  async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    await toast.present();
  }
}
