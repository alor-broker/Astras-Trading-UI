import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { ClientAuthContextService } from "../services/client-auth-context.service";
import {
  AREA_HOOK,
  AreaHook
} from "../../shared/services/hook/area/area-hook-token";

@Component({
  selector: 'ats-client-area-shell',
  templateUrl: './client-area-shell.component.html',
  styleUrl: './client-area-shell.component.less'
})
export class ClientAreaShellComponent implements OnInit, OnDestroy {
  constructor(
    private readonly clientAuthContextService: ClientAuthContextService,
    @Inject(AREA_HOOK) @Optional()
    private readonly areaHooks: AreaHook[] | null,
  ) {
  }

  ngOnDestroy(): void {
    this.destroyHooks();
  }

  ngOnInit(): void {
    this.clientAuthContextService.checkAccess()
      .subscribe(result => {
        if (result) {
          this.initAfterAuth();
        }
      });
  }

  private initAfterAuth(): void {
    this.executeHooks();
  }

  private executeHooks(): void {
    (this.areaHooks ?? []).forEach(x => {
      x.onInit();
    });
  }

  private destroyHooks(): void {
    (this.areaHooks ?? []).forEach(x => {
      x.onDestroy();
    });
  }
}
