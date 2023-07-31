import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'ats-sso-callback',
  templateUrl: './sso-callback.component.html',
  styleUrls: ['./sso-callback.component.less']
})
export class SsoCallbackComponent implements OnInit {

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.authService.setRefreshToken(params['refreshToken']?.trim());
      this.router.navigate(['/dashboard']);
    });
  }

}
