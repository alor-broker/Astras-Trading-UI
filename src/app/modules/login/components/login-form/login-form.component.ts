import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Login } from '../../../../shared/models/login.model';
import { AccountService } from '../../../../shared/services/account.service';

@Component({
  selector: 'ats-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.sass']
})
export class LoginFormComponent implements OnInit {

  constructor(
    private authorizeService: AccountService,
    private router: Router) { }

    model: Login = {
      username: '',
      password: ''
    };

    submitted = false;

  onSubmit() {
    this.submitted = true;

    // Validation on empty strings is done in html
    this.authorizeService.login({
      username: this.model.username!,
      password: this.model.password!
    }).subscribe();
  }

  ngOnInit(): void {
    this.authorizeService.isAuthorised$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['profile']);
      }
    })
  }
}
