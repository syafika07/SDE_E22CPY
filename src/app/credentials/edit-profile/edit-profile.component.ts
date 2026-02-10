import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  ModalController,
  AlertController,
  ToastController, IonCardContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/angular/standalone';

import { supabase } from 'src/app/services/supabaseClient';
import { ChangeEmailComponent } from 'src/app/credentials/change-email/change-email.component';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  standalone: true,
  imports: [ IonCardTitle, IonCardHeader, IonCard, IonCardContent,
    CommonModule,
    FormsModule,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,IonCardSubtitle
  ]
})
export class EditProfileComponent implements OnInit {
  @Input() userData: any = {};

  formData = {
    name: '',
    role: ''
  };

  private originalName = '';

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.formData.name = this.userData.name || '';
    this.formData.role = this.userData.role || '';
    this.originalName = this.formData.name.trim();
  }

  // ===============================
  // UI Helpers
  // ===============================
  get hasChanges(): boolean {
    return this.formData.name.trim() !== this.originalName;
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // ===============================
  // SAVE PROFILE (NAME ONLY)
  // ===============================
  async save() {
    const name = this.formData.name.trim();

    if (!name) {
      await this.showToast('Nama tidak boleh kosong', 'danger');
      return;
    }

    if (name === this.originalName) {
      this.dismiss();
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { name }
    });

    if (error) {
      await this.showToast('Gagal kemaskini nama: ' + error.message, 'danger');
      return;
    }

    await this.showToast('Profil berjaya dikemaskini', 'success');

    this.modalCtrl.dismiss(
      { id: this.userData.id, name },
      'confirm'
    );
  }

  // ===============================
  // RESET PASSWORD
  // ===============================
  async openResetPasswordAlert() {
    const user = await supabase.auth.getUser();
    const email = user.data.user?.email;

    if (!email) {
      await this.showToast('Email tidak dijumpai', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Reset Password',
      message: `A reset link will be sent to: ${email}`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Send',
          handler: async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
              await this.showToast(error.message, 'danger');
              return false;
            }

            await this.showToast('Pautan reset telah dihantar', 'success');
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // ===============================
  // CHANGE EMAIL FLOW (SECURE)
  // ===============================
async startChangeEmail() {
  const modal = await this.modalCtrl.create({
    component: ChangeEmailComponent
  });
  await modal.present();
}


  async openReauthPrompt() {
    const alert = await this.alertController.create({
      header: 'Pengesahan Diperlukan',
      message: 'Masukkan kod yang dihantar ke emel lama anda',
      inputs: [
        {
          name: 'otp',
          type: 'text',
          placeholder: '6 digit kod'
        }
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Sahkan',
          handler: async (data) => {
            if (!data.otp) {
              await this.showToast('Kod diperlukan', 'danger');
              return false;
            }

            await this.verifyReauthOTP(data.otp);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async verifyReauthOTP(otp: string) {
  const user = await supabase.auth.getUser();
  const email = user.data.user?.email;

  if (!email) {
    await this.showToast('Email pengguna tidak dijumpai', 'danger');
    return;
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email'
  });
    if (error) {
      await this.showToast('Kod tidak sah atau tamat tempoh', 'danger');
      return;
    }

    await this.openChangeEmailModal();
  }

  async openChangeEmailModal() {
    const modal = await this.modalCtrl.create({
      component: ChangeEmailComponent
    });

    await modal.present();
  }

  // ===============================
  // TOAST
  // ===============================
  async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
      color
    });
    await toast.present();
  }
}
