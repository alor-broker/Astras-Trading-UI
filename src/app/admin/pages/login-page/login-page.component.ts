import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent
} from "ng-zorro-antd/form";
import {
  NzInputDirective,
  NzInputGroupComponent
} from "ng-zorro-antd/input";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TranslocoDirective } from "@jsverse/transloco";
import {
  BehaviorSubject,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import { LetDirective } from "@ngrx/component";
import { AdminIdentityService } from "../../services/identity/admin-identity.service";
import { LoginStatus } from "../../services/identity/admin-identity-service.models";
import {
  AsyncPipe,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault
} from "@angular/common";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { AdminAuthContextService } from "../../services/auth/admin-auth-context.service";
import { Router } from "@angular/router";

enum LoginErrorCode {
  Unknown = 'unknown',
  WrongCredentials = 'wrongCredentials'
}

@Component({
  selector: 'ats-login-page',
  standalone: true,
  imports: [
    NzFormDirective,
    ReactiveFormsModule,
    NzFormItemComponent,
    NzFormControlComponent,
    NzInputGroupComponent,
    NzInputDirective,
    NzButtonComponent,
    TranslocoDirective,
    LetDirective,
    AsyncPipe,
    NgSwitch,
    NzTypographyComponent,
    NgSwitchCase,
    NgSwitchDefault,
    NgIf
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.less'
})
export class LoginPageComponent implements OnDestroy, AfterViewInit {
  readonly isLoading$ = new BehaviorSubject(false);
  readonly loginError$ = new BehaviorSubject<LoginErrorCode | null>(null);
  readonly LoginErrorCodes = LoginErrorCode;

  @ViewChildren('userNameControl')
  userNameControlQuery!: QueryList<ElementRef<HTMLInputElement>>;

  readonly loginForm = this.formBuilder.nonNullable.group({
    userName: this.formBuilder.nonNullable.control('',
      [
        Validators.required,
        Validators.maxLength(500)
      ]
    ),
    password: this.formBuilder.nonNullable.control('',
      [
        Validators.required,
        Validators.maxLength(500)
      ]
    ),
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly adminIdentityService: AdminIdentityService,
    private readonly adminAuthContextService: AdminAuthContextService,
    private readonly router: Router
  ) {
  }

  ngAfterViewInit(): void {
    this.userNameControlQuery.changes.pipe(
      map(x => x.first as ElementRef<HTMLElement> | undefined),
      startWith(this.userNameControlQuery.first),
      filter((x): x is ElementRef<HTMLInputElement> => !!x),
      map(x => x.nativeElement),
      take(1)
    ).subscribe(el => {
      setTimeout(
        () => {
          el.select();
        },
        500
      );
    });
  }

  submit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    of(this.loginForm.value).pipe(
      tap(() => {
        this.loginError$.next(null);
        this.loginForm.disable();
        this.isLoading$.next(true);
      }),
      switchMap(c => this.adminIdentityService.login({
        login: c.userName!,
        password: c.password!
      })),
      tap(() => {
        this.loginForm.enable();
        this.isLoading$.next(false);
      })
    ).subscribe(r => {
      if (r?.result != null) {
        this.adminAuthContextService.setJwt(r.result.refreshToken, r.result.jwt);
        this.router.navigate(['/admin']);
        return;
      }

      this.loginError$.next(
        r?.status === LoginStatus.WrongCredentials
          ? LoginErrorCode.WrongCredentials
          : LoginErrorCode.Unknown
      );
    });
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.loginError$.complete();
  }
}
