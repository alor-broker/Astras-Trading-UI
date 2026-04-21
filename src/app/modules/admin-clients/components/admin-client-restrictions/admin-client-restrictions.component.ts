import {
  Component,
  inject,
  model,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {Client} from "../../services/clients/admin-clients-service.models";
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from "ng-zorro-antd/modal";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {AdminClientsService} from "../../services/clients/admin-clients.service";
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
    NzTableModule
  ],
  templateUrl: './admin-client-restrictions.component.html',
  styleUrl: './admin-client-restrictions.component.less',
  encapsulation: ViewEncapsulation.None
})
export class AdminClientRestrictionsComponent implements OnInit {
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
