import { Component } from '@angular/core';

import { SafePipe } from "../../pipe/safe.pipe";
import { HeaderComponent } from "src/app/components/header/header.component";
import {
  IonContent,

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonContent,
    SafePipe,
    HeaderComponent
],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage {

  lookerUrl = 'https://lookerstudio.google.com/embed/reporting/ee7709a4-73a8-4176-b95a-e8c29d4f1a9c/page/7NuaF';
  iframeKey = true;

  ionViewWillEnter() {
    this.iframeKey = false;
    setTimeout(() => this.iframeKey = true, 50);
  }


}
