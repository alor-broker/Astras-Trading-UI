import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from "../../../shared/services/auth.service";

@Component({
  selector: 'ats-sso-callback-page',
  templateUrl: './sso-callback-page.component.html',
  styleUrl: './sso-callback-page.component.less'
})
export class SsoCallbackPageComponent implements OnInit {
  @Input()
  refreshToken?: string;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.authService.setRefreshToken((this.refreshToken ?? '').trim());
    this.router.navigate(['/dashboard']);
  }
}
