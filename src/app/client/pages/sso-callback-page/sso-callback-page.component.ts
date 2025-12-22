import {
  Component,
  OnInit,
  input
} from '@angular/core';
import { Router } from "@angular/router";
import { ClientAuthContextService } from "../../services/auth/client-auth-context.service";

@Component({
    selector: 'ats-sso-callback-page',
    templateUrl: './sso-callback-page.component.html',
    styleUrl: './sso-callback-page.component.less'
})
export class SsoCallbackPageComponent implements OnInit {
  readonly refreshToken = input<string>();

  constructor(
    private readonly router: Router,
    private readonly clientAuthContextService: ClientAuthContextService
  ) {
  }

  ngOnInit(): void {
    this.clientAuthContextService.setRefreshToken((this.refreshToken() ?? '').trim());
    this.router.navigate(['/dashboard']);
  }
}
