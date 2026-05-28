import {DOCUMENT} from '@angular/common';
import {
  inject,
  Injectable
} from '@angular/core';
import {Capacitor} from '@capacitor/core';
import {Hook} from '@terminal-core-lib/common/types/hook.types';

@Injectable()
export class CapacitorBodyClassHook implements Hook {
  private readonly document = inject<Document>(DOCUMENT);

  onDestroy(): void {
    this.document.body.classList.remove('capacitor');
  }

  onInit(): void {
    if (Capacitor.isNativePlatform()) {
      this.document.body.classList.add('capacitor');
    }
  }
}
