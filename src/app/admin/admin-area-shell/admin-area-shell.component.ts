import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import {
  AREA_HOOK,
  AreaHook
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
  constructor(
    private readonly adminAuthContextService: AdminAuthContextService,
    @Inject(AREA_HOOK) @Optional()
    private readonly areaHooks: AreaHook[] | null,
  ) {
  }

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
