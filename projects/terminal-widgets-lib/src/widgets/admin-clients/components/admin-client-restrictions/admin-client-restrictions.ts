import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from "ng-zorro-antd/modal";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {toObservable} from "@angular/core/rxjs-interop";
import {
  of,
  switchMap,
  tap
} from "rxjs";
import {
  AsyncPipe,
  DatePipe
} from "@angular/common";
import {NzResultComponent} from "ng-zorro-antd/result";
import {NzTableModule} from "ng-zorro-antd/table";
import {Client} from '@terminal-widgets-lib/widgets/admin-clients/services/admin-clients-service.types';
import {AdminClientsService} from '@terminal-widgets-lib/widgets/admin-clients/services/admin-clients.service';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';

@Component({
  selector: 'ats-admin-client-restrictions',
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    NzButtonComponent,
    NzModalFooterDirective,
    TranslocoDirective,
    NzSpinComponent,
    AsyncPipe,
    NzResultComponent,
    DatePipe,
    NzTableModule,
    NzTypographyComponent
  ],
  templateUrl: './admin-client-restrictions.html',
  styleUrl: './admin-client-restrictions.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AdminClientRestrictions implements OnInit {
  readonly targetClient = model<Omit<Client, 'spectraExtension'> | null>(null);

  protected readonly isLoading = signal(false);

  private readonly adminClientsService = inject(AdminClientsService);

  protected readonly restrictions$ = toObservable(this.targetClient).pipe(
    switchMap(target => {
      this.isLoading.set(true);
      if (target == null) {
        return of(null);
      }
      return this.adminClientsService.getClientRestrictions(target.clientId).pipe(
        tap(() => this.isLoading.set(false))
      );
    })
  );

  ngOnInit(): void {
    this.isLoading.set(true);
  }

  protected close(): void {
    this.targetClient.set(null);
  }
}
