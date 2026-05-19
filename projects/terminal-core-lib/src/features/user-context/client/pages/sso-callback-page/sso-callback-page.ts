import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Router} from '@angular/router';
import {ClientAuthService} from "../../services/client-auth.service";

@Component({
  selector: 'atsd-sso-callback-page',
  imports: [],
  templateUrl: './sso-callback-page.html',
  styleUrls: ['./sso-callback-page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SsoCallbackPage implements OnInit {
  readonly refreshToken = input<string>();

  private readonly router = inject(Router);

  private readonly clientAuthService = inject(ClientAuthService);

  ngOnInit(): void {
    this.clientAuthService.setRefreshToken((this.refreshToken() ?? '').trim());
    this.router.navigate(['/']);
  }
}
