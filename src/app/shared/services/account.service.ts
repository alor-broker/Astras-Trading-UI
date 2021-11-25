import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';
import { map } from 'rxjs/operators';
import { Login } from '../models/login.model';
import { Router } from '@angular/router';

export enum AuthenticationResultStatus {
  Success,
  Redirect,
  Fail
}

export interface IAuthenticationResult {
  status: AuthenticationResultStatus.Success;
  state: any;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountUrl = environment.apiUrl + 'account';
  private currentUser = new BehaviorSubject<User>({  });

  currentUser$ = this.currentUser.asObservable();
  isAuthorised$ = this.currentUser$.pipe(
    map(user => {
      return this.isAuthorised(user);
    })
  )

  constructor(private http: HttpClient, private router: Router)
  {
    const user: User = JSON.parse(localStorage.getItem('user')!);
    this.setCurrentUser(user);
  }

  public login(request: Login) {
    return this.http.post<User>(`${this.accountUrl}/login`, request).pipe(
      map((user: User) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.setCurrentUser(user);
        }
      }));
  }

  public logout() {
    localStorage.removeItem('user');
    this.currentUser.next({});
  }

  public isAuthorised(user?: User): boolean {
    if (!user) {
      user = this.currentUser.getValue();
    }
    if (user && user.token) {
      return this.checkTokenTime(user.token);
    }
    return false;
  }

  public getAccessToken(): string | undefined {
    return this.currentUser.getValue()?.token;
  }

  private checkTokenTime(token: string | undefined): boolean {
    if (token) {
      const mainPart = token.split('.')[1];
      const decodedString = atob(mainPart);
      const expirationTime = JSON.parse(decodedString)['exp'] * 1000;
      const now = Date.now();
      return now < expirationTime;
    }
    return false;
  }

  private setCurrentUser(user: User) {
    this.currentUser.next(user);
  }
}
