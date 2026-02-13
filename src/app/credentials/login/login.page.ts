import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { NGXLogger } from 'ngx-logger';

import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonText,
  IonButton,
  IonSpinner
} from '@ionic/angular/standalone';

import { SupabaseService } from 'src/app/services/supabase.service';
import { SessionService } from 'src/app/services/session';
import { ROUTES } from 'src/app/routes-map';
import { supabase } from 'src/app/services/supabaseClient';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonText,
    IonButton,
    IonSpinner,
    ReactiveFormsModule
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private session: SessionService,
    private supabaseService: SupabaseService,
    private logger: NGXLogger,
    private alertCtrl: AlertController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  // =========================
  // LOGIN
  // =========================
  async onLogin() {
    if (this.loginForm.invalid || this.loading) return;
    this.loading = true;

    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('User tidak dijumpai');

      const user = data.user;
      this.supabaseService.emitUser(user);

      // Ambil profile
      let profile = await this.supabaseService.getProfile(user.id);
      if (!profile) {
        const name = email.split('@')[0];
        profile = await this.supabaseService.createProfile(
          user.id,
          email,
          name,
          'user'
        );
      }

      const role = profile?.role || 'user';
      this.session.startSession(user, role);

      if (role === 'editor') {
        await this.router.navigateByUrl(ROUTES.ADD_INFO);
      } else {
        await this.router.navigateByUrl(ROUTES.UPLOAD_DATA);
      }
    } catch (err: any) {
      this.logger.error('Login error:', err);
      await this.showAlert(
        'Login Gagal',
        err?.message || 'Email atau password salah'
      );
    } finally {
      this.loading = false;
    }
  }

  // =========================
  // RESET PASSWORD (EMAIL) with profiles check (case-insensitive)
  // =========================
async onResetPassword() {
  const alertEl = await this.alertCtrl.create({
    header: 'Forgot Password',
    message: 'Masukkan email untuk reset password',
    cssClass: 'custom-reset-alert',
    inputs: [
      {
        name: 'email',
        type: 'email',
        placeholder: 'contoh@email.com',
        value: this.loginForm.get('email')?.value || ''
      }
    ],
    buttons: [
      {
        text: 'Batal',
        role: 'cancel'
      },
      {
        text: 'Hantar',
        handler: async (data) => {
          if (!data.email) {
            await this.showAlert('Ralat', 'Email diperlukan');
            return false;
          }

          try {
            // 1️⃣ Trim & lowercase email
            const emailClean = data.email.trim().toLowerCase();

            // 2️⃣ Check email exists in profiles (case-insensitive, trimmed)
            const { data: profileData, error: profileError } =
              await supabase
                .from('profiles')
                .select('id')
                .ilike('email', emailClean)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profileData) {
              await this.showAlert('Ralat', 'Email tidak wujud');
              return false;
            }

            // 3️⃣ Email exists, send reset link
            const { error } = await supabase.auth.resetPasswordForEmail(
              emailClean,
              {
                redirectTo:
                  'https://sde22-dashboard.onrender.com/reset-pass'
              }
            );

            if (error) throw error;

            await this.showAlert(
              'Berjaya',
              'Email reset password telah dihantar. Sila semak inbox.'
            );
            return true;

          } catch (err: any) {
            await this.showAlert(
              'Gagal',
              err?.message || 'Gagal hantar email reset'
            );
            return false;
          }
        }
      }
    ]
  });

  await alertEl.present();
}


  // =========================
  // ALERT HELPER
  // =========================
  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
