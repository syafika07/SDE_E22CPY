import { Component, ViewChild } from '@angular/core';
import { IonicModule, IonMenu } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { SafePipe } from "../../pipe/safe.pipe";
import { HeaderComponent } from "src/app/components/header/header.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule, SafePipe, HeaderComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage {

  lookerUrl = 'https://lookerstudio.google.com/embed/reporting/ee7709a4-73a8-4176-b95a-e8c29d4f1a9c/page/p_juuu1gn4wd';
  iframeKey = true;

  ionViewWillEnter() {
    this.iframeKey = false;
    setTimeout(() => this.iframeKey = true, 50);
  }


}
