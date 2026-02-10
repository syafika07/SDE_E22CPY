import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem,
  IonInput,
  IonButton,
  ModalController,
  ToastController,
  IonCardSubtitle,
  IonCardTitle,
  IonCardHeader,
  IonCard,
  IonCardContent,
  IonLabel
} from '@ionic/angular/standalone';

import { supabase } from 'src/app/services/supabaseClient';

@Component({
  selector: 'app-change-email',
  standalone: true,
  templateUrl: './change-email.component.html',
  styleUrls: ['./change-email.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonInput,
    IonButton,
    IonCardContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonLabel
  ]
})
export class ChangeEmailComponent {
  password = '';
  newEmail = '';
  loading = false;
  step: 1 | 2 = 1; // 1 = Re-auth, 2 = Input new email
  polling = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  // ===============================
  // Dismiss modal
  // ===============================
  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // ===============================
  // STEP 1: Confirm Password (Re-authentication)
  // ===============================
  async confirmPassword() {
    const passwordTrim = this.password.trim();
    if (!passwordTrim) {
      await this.showToast('Please enter password', 'danger');
      return;
    }

    this.loading = true;
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user?.email) throw new Error('Invalid user');

      // Re-authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordTrim
      });

      if (authError) throw new Error('Incorrect password');

      // Password betul → proceed ke step 2
      this.step = 2;
    } catch (err: any) {
      await this.showToast(err.message || 'Failed to verify password', 'danger');
    } finally {
      this.loading = false;
    }
  }

  // ===============================
  // STEP 2: Confirm Change Email (Update Auth only)
  // ===============================
  async confirmChangeEmail() {
    const newEmailTrim = this.newEmail.trim();

    // 1️⃣ Basic validation
    if (!newEmailTrim) {
      await this.showToast('Please enter a new email', 'danger');
      return;
    }

    if (!this.isValidEmail(newEmailTrim)) {
      await this.showToast('Please enter a valid email', 'danger');
      return;
    }

    this.loading = true;

    try {
      // 2️⃣ Get current user
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user?.id || !user?.email) throw new Error('Invalid user');

      // 3️⃣ Check if new email same as current
      if (newEmailTrim.toLowerCase() === user.email.toLowerCase()) {
        await this.showToast('This is already your current email', 'danger');
        return;
      }

      // 4️⃣ Update email in Auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmailTrim
      });

      // 5️⃣ Handle duplicate email
      if (updateError) {
        if (updateError.message.toLowerCase().includes('already registered')) {
          await this.showToast('This email is already in use', 'danger');
        } else {
          throw updateError;
        }
        return;
      }

      // 6️⃣ Success toast
      await this.showToast(
        'Email updated. Please check your new email and click the verification link.',
        'success'
      );

      // 7️⃣ Start polling untuk detect email_verified
      this.startPolling(user.id, newEmailTrim);

      // Reset input
      this.password = '';
      this.newEmail = '';

    } catch (err: any) {
      await this.showToast(err.message || 'Failed to change email', 'danger');
    } finally {
      this.loading = false;
    }
  }

  // ===============================
  // Poll Supabase setiap 5s untuk detect email_verified
  // ===============================
  private startPolling(userId: string, newEmail: string) {
    if (this.polling) return;
    this.polling = true;

    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user?.email === newEmail && !!user?.email_confirmed_at) {
        clearInterval(interval);
        this.polling = false;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ email: newEmail })
          .eq('id', userId);

        if (profileError) {
          await this.showToast('Failed to update profile', 'danger');
        } else {
          await this.showToast(
            'Email has been successfully verified and updated in your profile!',
            'success'
          );
          this.modalCtrl.dismiss({ email: newEmail }, 'success');
        }
      }
    }, 5000); // check setiap 5 saat
  }

  // ===============================
  // HELPERS
  // ===============================
  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' = 'success'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
