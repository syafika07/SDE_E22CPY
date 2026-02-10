import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/services/supabase.service';

import { HeaderComponent } from "src/app/components/header/header.component";
import { NGXLogger } from 'ngx-logger';
import {
  IonContent,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonInput,
  IonText,
  IonButton,
  IonSelect,
  IonSelectOption, IonCardHeader, IonSpinner, IonItem, IonCardContent } from '@ionic/angular/standalone';
import { ROUTES } from 'src/app/routes-map';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [IonCardContent, IonItem, IonSpinner, IonCardHeader,CommonModule,
    HeaderComponent,
    IonContent,
    IonCard,
    IonCardTitle,
    IonCardSubtitle,
    IonInput,
    IonText,
    IonButton,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule
],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private logger: NGXLogger
  ) {
    this.logger.debug('AppComponent initialized');
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],          // ✅ tambah field name
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['user', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.checkProAdminAccess();
  }

  async checkProAdminAccess() {
    const user = await this.supabaseService.getUser();
    if (!user) {
        this.router.navigateByUrl(ROUTES.LOGIN);
      return;
    }

    const profile = await this.supabaseService.getProfile(user.id);
    if (profile?.role !== 'proadmin') {
      alert('Anda tidak mempunyai kebenaran untuk akses halaman ini.');
        this.router.navigateByUrl(ROUTES.DASHBOARD);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

 async onRegister() {
  if (this.registerForm.invalid) {
    this.errorMessage = 'Sila isi semua ruangan dengan betul.';
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  const { email, password, name, role } = this.registerForm.value;

  try {
    // signUp() return AppUser terus
    const appUser = await this.supabaseService.signUp(email, password, name, role);

    if (appUser) {
      this.successMessage = `Pendaftaran berjaya! Akaun untuk ${appUser.name} telah didaftarkan.`;

      // reset form selepas 3 saat
      setTimeout(() => {
        this.registerForm.reset({ role: 'user' });
        this.successMessage = '';
      }, 3000);
    }

  } catch (error: any) {
    this.logger.error('Register error:', error);
    this.errorMessage = error?.message || 'Ralat semasa mendaftar.';
  } finally {
    this.isLoading = false;
  }
}


  // Form getters
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get role() { return this.registerForm.get('role'); }
}

