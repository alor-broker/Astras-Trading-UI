import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AREA_HOOK } from "../../shared/services/hook/area/area-hook-token";
import { ClientAuthContextService } from "../services/auth/client-auth-context.service";
import {RouterOutlet} from "@angular/router";

@Component({
    selector: 'ats-client-area-shell',
    templateUrl: './client-area-shell.component.html',
    styleUrl: './client-area-shell.component.less',
    imports: [
        RouterOutlet
    ]
})
export class ClientAreaShellComponent implements OnInit, OnDestroy {
  private readonly clientAuthContextService = inject(ClientAuthContextService);
  private readonly areaHooks = inject(AREA_HOOK, { optional: true });

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
