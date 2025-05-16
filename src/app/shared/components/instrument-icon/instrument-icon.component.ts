import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { EnvironmentService } from "../../services/environment.service";
import { NzAvatarComponent } from "ng-zorro-antd/avatar";

@Component({
  selector: 'ats-instrument-icon',
  imports: [
    NzAvatarComponent
  ],
  templateUrl: './instrument-icon.component.html',
  styleUrl: './instrument-icon.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentIconComponent {
  symbol = input.required<string>();
  size = input<'large' | 'small' | 'default' | number>();

  readonly iconUrl = computed(() => `${this.environmentService.alorIconsStorageUrl}/${this.symbol()}.png`);

  constructor(private readonly environmentService: EnvironmentService) {
  }
}
