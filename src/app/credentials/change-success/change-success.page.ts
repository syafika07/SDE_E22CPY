import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { ROUTES } from 'src/app/routes-map';

@Component({
  selector: 'app-change-success',
  standalone: true,
  templateUrl: './change-success.page.html',
  styleUrls: ['./change-success.page.scss'],
  imports: [ CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton]
})
export class ChangeSuccessPage implements OnInit {
lang = 'en'; // atau 'ms' untuk Malay

title = this.lang === 'ms' ? 'Berjaya!' : 'Success!';
subtitle = this.lang === 'ms'
  ? 'Sila login menggunakan email / password baru.'
  : 'Please log in using your new email or password.';


  constructor(private router: Router, private route: ActivatedRoute) {}

ngOnInit() {
  const type = this.route.snapshot.queryParamMap.get('type');
  const lang = this.route.snapshot.queryParamMap.get('lang') || 'en'; // 'en' = English, 'ms' = Malay

  if (type === 'email') {
    this.subtitle = lang === 'ms'
      ? 'Email berjaya ditukar. Sila login menggunakan email baru.'
      : 'Email successfully changed. Please login with your new email.';
  } else if (type === 'password') {
    this.subtitle = lang === 'ms'
      ? 'Password berjaya ditukar. Sila login semula.'
      : 'Password successfully changed. Please login again.';
  }
}


  goToLogin() {
  this.router.navigateByUrl(ROUTES.LOGIN, { replaceUrl: true });
  }
}
