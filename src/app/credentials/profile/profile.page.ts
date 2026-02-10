import { Component, OnInit } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  ModalController,
  ToastController, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { ROUTES } from '../../routes-map';
import { EditProfileComponent } from '../../credentials/edit-profile/edit-profile.component';
import { HeaderComponent } from "src/app/components/header/header.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonSpinner,
    IonContent,
    IonButton,
    HeaderComponent
]
})
export class ProfilePage implements OnInit {

  profile: any = null;
  loading = true;

  constructor(
    private supabaseService: SupabaseService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  roleLabelMap: Record<string, string> = {
     proadmin: 'Super Admin',
    admin: 'Admin',
    user: 'Operator'
  };
  ngOnInit() {
    // Semak pengguna login
    this.supabaseService.user$.subscribe(async (user) => {
      if (!user) {
        this.showToast('Sila login terlebih dahulu', 'danger');
        this.router.navigateByUrl(ROUTES.LOGIN);
        return;
      }

      const profile = await this.supabaseService.getProfile(user.id);
      if (!profile) {
        this.showToast('Profil tidak dijumpai', 'danger');
        this.router.navigateByUrl(ROUTES.LOGIN);
        return;
      }

      this.profile = profile;
      this.loading = false;
    });
  }

  async openEditModal() {
    if (!this.profile) return;

    const modal = await this.modalCtrl.create({
      component: EditProfileComponent,
      cssClass: 'edit-profile-modal',
      backdropDismiss: true,
      componentProps: {
        userData: {
          id: this.profile.id,
          name: this.profile.name,
          email: this.profile.email,
          role: this.profile.role,
        }
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      try {
        // Kemas kini data utama (nama & emel)
        await this.supabaseService.updateFullUser(this.profile.id, {
          email: data.email,
          name: data.name,
          role: this.profile.role // jangan ubah role
        });

        // Jika ada password, hantar ke fungsi khas
        if (data.password) {
          const res = await fetch(
            'https://uonphwbbgemsvqzrdcwp.supabase.co/functions/v1/update-password',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: this.profile.id,
                newPassword: data.password
              })
            }
          );
          const result = await res.json();
          if (result.error) throw new Error(result.error);
        }

        // Kemas kini paparan tempatan
        this.profile = { ...this.profile, name: data.name, email: data.email };
        delete this.profile.password; // pastikan password tidak disimpan

        this.showToast('Profile has been updated successfully', 'success');
      } catch (err: any) {
        console.error(err);
        this.showToast('Fail to update profile: ' + (err.message || err), 'danger');
      }
    }
  }

  async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({ message, duration: 5000, color });
    await toast.present();
  }
}
