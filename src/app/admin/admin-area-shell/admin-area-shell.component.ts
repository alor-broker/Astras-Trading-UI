import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  AREA_HOOK
} from "../../shared/services/hook/area/area-hook-token";
import { AdminAuthContextService } from "../services/auth/admin-auth-context.service";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: 'ats-admin-area-shell',
    templateUrl: './admin-area-shell.component.html',
    styleUrl: './admin-area-shell.component.less',
    imports: [
        RouterOutlet
    ]
})
export class AdminAreaShellComponent implements OnInit, OnDestroy {
  private readonly adminAuthContextService = inject(AdminAuthContextService);
  private readonly areaHooks = inject(AREA_HOOK, { optional: true });

  ngOnDestroy(): void {
    this.destroyHooks();
  }

  ngOnInit(): void {
    this.adminAuthContextService.checkAccess();
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
