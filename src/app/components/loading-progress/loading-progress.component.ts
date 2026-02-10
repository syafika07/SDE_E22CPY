import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-progress',
  standalone: true,
  imports: [CommonModule, IonSpinner],
  templateUrl: './loading-progress.component.html',
  styleUrls: ['./loading-progress.component.scss']
})
export class LoadingProgressComponent {
  @Input() show: boolean = false;
  @Input() progress: number = 0;
  @Input() message: string = 'Loading...';
  @Input() phase: string = 'Processing'; // contoh: 'Fetching data', 'Generating charts'
}
