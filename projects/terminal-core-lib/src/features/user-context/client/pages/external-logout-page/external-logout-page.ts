import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {ClientAuthService} from "../../services/client-auth.service";

@Component({
  selector: 'ats-external-logout-page',
  imports: [],
  templateUrl: './external-logout-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ExternalLogoutPage implements OnInit {
  private readonly clientAuthService = inject(ClientAuthService);

  ngOnInit(): void {
    this.clientAuthService.forceLogout();
  }
}
