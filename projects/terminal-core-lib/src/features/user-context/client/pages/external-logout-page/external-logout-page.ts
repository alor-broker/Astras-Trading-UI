import {
  Component,
  inject,
  OnInit
} from '@angular/core';
import {ClientAuthService} from "../../services/client-auth.service";

@Component({
  selector: 'ats-external-logout-page',
  imports: [],
  templateUrl: './external-logout-page.html'
})
export class ExternalLogoutPage implements OnInit {
  private readonly clientAuthService = inject(ClientAuthService);

  ngOnInit(): void {
    this.clientAuthService.forceLogout();
  }
}
