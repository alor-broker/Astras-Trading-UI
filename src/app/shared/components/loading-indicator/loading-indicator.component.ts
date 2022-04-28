import { Component, Input } from '@angular/core';

@Component({
  selector: 'ats-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.less']
})
export class LoadingIndicatorComponent {
  @Input()
  isLoading: boolean | null = false;
}
