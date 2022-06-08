import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'ats-sso-callback',
  templateUrl: './sso-callback.component.html',
  styleUrls: ['./sso-callback.component.less']
})
export class SsoCallbackComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute, private account: AuthService) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.account.setUser({
        refreshToken: params['refreshToken']?.trim(),
        login: params['userName']?.trim(),
        jwt: params['token'],
        isLoggedOut: false
      });
    });
    this.router.navigate(['/dashboard']);
  }

}
