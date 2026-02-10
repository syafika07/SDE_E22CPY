import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/services/supabase.service';
import { ROUTES } from 'src/app/routes-map';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonLabel
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    IonCardSubtitle,
    IonLabel,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    ReactiveFormsModule,
    CommonModule,

  ],
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss']
})
export class ResetPasswordPage implements OnInit {

  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required]
    });
  }

  async ngOnInit() {
    // Check session supaya link reset sah
    const session = await this.supabaseService.getCurrentSession();
    if (!session?.data?.session) {
      alert('This password reset link is invalid or has expired. Please request a new one.');
      this.router.navigateByUrl(`/${ROUTES.LOGIN}`);
    }
  }

async onSubmit() {
  if (this.form.invalid || this.loading) return;

  const { password, confirm } = this.form.value;

  if (password !== confirm) {
    alert('The passwords you entered do not match. Please try again.');
    return;
  }

  this.loading = true;

  try {
    const { error } = await this.supabaseService.updatePassword(password);
    if (error) throw error;

    // Terus redirect ke CHANGES tanpa alert
    this.router.navigate([`/${ROUTES.CHANGES}`], {
      queryParams: { type: 'password', lang: 'en' }
    });

  } catch (err: any) {
  alert(err.message || 'Failed to reset password');
  } finally {
    this.loading = false;
  }
}

}
