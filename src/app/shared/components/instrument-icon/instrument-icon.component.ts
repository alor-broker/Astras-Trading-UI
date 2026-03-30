import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
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
  private readonly environmentService = inject(EnvironmentService);

  readonly symbol = input.required<string>();
  readonly size = input<'large' | 'small' | 'default' | number>();
  readonly shape = input<'square' | 'circle' | 'rounded-square'>('circle');

  readonly iconUrl = computed(() => `${this.environmentService.alorIconsStorageUrl}/${this.symbol()}.png`);
}
