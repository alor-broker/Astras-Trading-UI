import { Component, OnInit, input, inject } from '@angular/core';
import { Router } from "@angular/router";
import { ClientAuthContextService } from "../../services/auth/client-auth-context.service";

@Component({
    selector: 'ats-sso-callback-page',
    templateUrl: './sso-callback-page.component.html',
    styleUrl: './sso-callback-page.component.less'
})
export class SsoCallbackPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly clientAuthContextService = inject(ClientAuthContextService);

  readonly refreshToken = input<string>();

  ngOnInit(): void {
    this.clientAuthContextService.setRefreshToken((this.refreshToken() ?? '').trim());
    this.router.navigate(['/dashboard']);
  }
}
