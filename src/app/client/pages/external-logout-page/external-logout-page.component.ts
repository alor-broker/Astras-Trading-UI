import { Component, OnInit, inject } from '@angular/core';
import { ClientAuthContextService } from "../../services/auth/client-auth-context.service";

@Component({
    selector: 'ats-external-logout-page',
    templateUrl: './external-logout-page.component.html',
    styleUrl: './external-logout-page.component.less'
})
export class ExternalLogoutPageComponent implements OnInit {
  private readonly clientAuthContextService = inject(ClientAuthContextService);

  ngOnInit(): void {
    this.clientAuthContextService.forceLogout();
  }
}
