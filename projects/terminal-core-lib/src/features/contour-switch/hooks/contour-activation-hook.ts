import {
  inject,
  Injectable
} from '@angular/core';
import {
  Subscription,
  switchMap,
  timer
} from 'rxjs';
import {Hook} from '../../../common/types/hook.types';
import {ContourActivationDialogService} from '../services/contour-activation-dialog.service';

@Injectable()
export class ContourActivationHook implements Hook {
  private readonly contourActivationDialogService = inject(ContourActivationDialogService);

  private statusCheckSubscription?: Subscription;

  onInit(): void {
    this.statusCheckSubscription = timer(5000).pipe(
      switchMap(() => this.contourActivationDialogService.checkStatus())
    ).subscribe();
  }

  onDestroy(): void {
    this.statusCheckSubscription?.unsubscribe();
  }
}
