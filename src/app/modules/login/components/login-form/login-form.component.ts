import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Credentials } from 'src/app/shared/models/user/credentials.model';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'ats-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.less']
})
export class LoginFormComponent implements OnInit {

  constructor(
    private authorizeService: AuthService,
    private router: Router) { }

    model: Credentials = {
      login: '',
      password: ''
    };

    submitted = false;

  onSubmit() {
    this.submitted = true;

    // Validation on empty strings is done in html
    this.authorizeService.login(this.model).subscribe();
  }

  ngOnInit(): void {
    this.authorizeService.isAuthorised$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['profile']);
      }
    });
  }
}
