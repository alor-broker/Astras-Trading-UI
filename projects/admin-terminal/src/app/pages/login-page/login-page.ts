import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  ElementRef,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {AdminIdentityService} from "../../services/admin-identity.service";
import {Router} from '@angular/router';
import {toObservable} from '@angular/core/rxjs-interop';
import {AdminAuthService} from '../../services/admin-auth.service';
import {
  filter,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';
import {LoginStatus} from '../../services/admin-identity-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormModule} from 'ng-zorro-antd/form';
import {
  NzInputModule,
  NzInputWrapperComponent
} from 'ng-zorro-antd/input';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';

enum LoginErrorCode {
  Unknown = 'unknown',
  WrongCredentials = 'wrongCredentials'
}

@Component({
  selector: 'atsa-login-page',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzFormModule,
    NzIconDirective,
    NzButtonComponent,
    NzTypographyComponent,
    NzInputModule
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements AfterViewInit {
  readonly userNameControlQuery = contentChildren<ElementRef<HTMLInputElement>>('userNameControl');

  protected readonly isLoading = signal(false);

  protected readonly loginError = signal<LoginErrorCode | null>(null);

  protected readonly LoginErrorCodes = LoginErrorCode;

  private readonly formBuilder = inject(FormBuilder);

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

  private readonly adminIdentityService = inject(AdminIdentityService);

  private readonly adminAuthContextService = inject(AdminAuthService);

  private readonly router = inject(Router);

  private readonly userNameControlQueryChanges$ = toObservable(this.userNameControlQuery);

  ngAfterViewInit(): void {
    this.userNameControlQueryChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
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
        this.loginError.set(null);
        this.loginForm.disable();
        this.isLoading.set(true);
      }),
      switchMap(c => this.adminIdentityService.login({
        login: c.userName!,
        password: c.password!
      })),
      tap(() => {
        this.loginForm.enable();
        this.isLoading.set(false);
      })
    ).subscribe(r => {
      if (r?.result != null) {
        this.adminAuthContextService.setJwt(r.result.refreshToken, r.result.jwt);
        this.router.navigate(['/admin']);
        return;
      }

      this.loginError.set(r?.status === LoginStatus.WrongCredentials
        ? LoginErrorCode.WrongCredentials
        : LoginErrorCode.Unknown);
    });
  }
}
