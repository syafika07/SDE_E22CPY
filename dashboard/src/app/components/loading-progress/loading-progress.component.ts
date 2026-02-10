import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-progress',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './loading-progress.component.html',
  styleUrls: ['./loading-progress.component.scss'],
})
export class LoadingProgressComponent {
  /** Show or hide the loading overlay */
  @Input() show: boolean = false;

  /** Progress percentage (0 - 100) */
  @Input() progress: number = 0;

  /** Message under spinner */
  @Input() message: string = 'Loading...';
}
