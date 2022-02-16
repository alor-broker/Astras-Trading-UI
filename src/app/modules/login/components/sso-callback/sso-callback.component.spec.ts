/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SsoCallbackComponent } from './sso-callback.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardComponent } from 'src/app/modules/dashboard/components/dashboard/dashboard.component';

describe('SsoCallbackComponent', () => {
  let component: SsoCallbackComponent;
  let fixture: ComponentFixture<SsoCallbackComponent>;

  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [ SsoCallbackComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'dashboard', pathMatch: 'full', component: DashboardComponent }])
      ],
      providers: [ RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SsoCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
