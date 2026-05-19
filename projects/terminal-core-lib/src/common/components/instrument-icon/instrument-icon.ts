import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {ICONS_STORAGE_URL_PROVIDER} from '../../../config/api-url-providers';
import {NzAvatarComponent} from 'ng-zorro-antd/avatar';

@Component({
  selector: 'ats-instrument-icon',
  imports: [
    NzAvatarComponent
  ],
  templateUrl: './instrument-icon.html',
  styleUrl: './instrument-icon.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentIcon {
  readonly symbol = input.required<string>();

  readonly size = input<'large' | 'small' | 'default' | number>();

  readonly shape = input<'square' | 'circle' | 'rounded-square'>('circle');

  private readonly iconsStorageUrlsProvider = inject(ICONS_STORAGE_URL_PROVIDER);

  readonly iconUrl = computed(() => `${this.iconsStorageUrlsProvider.iconsStorageUrl}/${this.symbol()}.png`);
}
