import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-bottom-floating-panel',
  templateUrl: './bottom-floating-panel.component.html',
  styleUrls: ['./bottom-floating-panel.component.less']
})
export class BottomFloatingPanelComponent {
  @Input({required: true})
  guid!: string;

  @Input({required: true})
  isActive!: boolean;
}
