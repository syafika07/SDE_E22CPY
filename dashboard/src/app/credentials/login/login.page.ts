import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from 'src/app/services/session';
import { SupabaseService } from 'src/app/services/supabase.service';
import { NGXLogger } from 'ngx-logger';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  loginForm: FormGroup;
  loading = false;
  focused: { [key: string]: boolean } = {};

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private session: SessionService,
    private supabaseService: SupabaseService,
    private logger: NGXLogger
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onFocus(field: string) { this.focused[field] = true; }
  onBlur(field: string) { this.focused[field] = false; }

async onLogin() {
  if (this.loginForm.invalid || this.loading) return;
  this.loading = true;

  const { email, password } = this.loginForm.value;

  // buat login + timeout
  const loginPromise = this.supabaseService.signIn(email, password);
  const timeoutPromise = new Promise<User>((_, reject) =>
    setTimeout(() => reject(new Error('Server timeout')), 10000)
  );

  try {
    const user = await Promise.race([loginPromise, timeoutPromise]);

    // simpan user di reactive state
    this.supabaseService.emitUser(user);

    // dapat profile, cipta kalau takde
    let profile = await this.supabaseService.getProfile(user.id);
    if (!profile) {
      const name = email.split('@')[0];
      profile = await this.supabaseService.createProfile(user.id, email, name, 'user');
    }

    const role = profile?.role || 'user';
    this.session.startSession(user, role);

    await new Promise(resolve => setTimeout(resolve, 150));
    await this.router.navigate(['/dashboard']);
  } catch (err: any) {
    this.logger.error('Login error:', err);

    alert(err?.message || 'Login gagal. Cuba lagi');
    await new Promise(res => setTimeout(res, 3000));
    window.location.reload();
  } finally {
    this.loading = false;
  }
}

}
