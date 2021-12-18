import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'src/app/shared/services/account.service';

@Component({
  selector: 'ats-sso-callback',
  templateUrl: './sso-callback.component.html',
  styleUrls: ['./sso-callback.component.sass']
})
export class SsoCallbackComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute, private account: AccountService) {
    this.route.params
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.account.setUser({
        refreshToken: params['refreshToken'],
        login: params['userName'],
        jwt: params['token']
      })
    });
    this.router.navigate(['/dashboard']);
  }

}
