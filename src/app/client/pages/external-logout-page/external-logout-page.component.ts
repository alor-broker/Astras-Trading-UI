import {
  Component,
  OnInit
} from '@angular/core';
import { ClientAuthContextService } from "../../services/auth/client-auth-context.service";

@Component({
    selector: 'ats-external-logout-page',
    templateUrl: './external-logout-page.component.html',
    styleUrl: './external-logout-page.component.less',
    standalone: false
})
export class ExternalLogoutPageComponent implements OnInit {
  constructor(private readonly clientAuthContextService: ClientAuthContextService) {
  }

  ngOnInit(): void {
    this.clientAuthContextService.forceLogout();
  }
}
