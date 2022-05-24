import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoCallbackComponent } from './sso-callback.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardComponent } from 'src/app/modules/dashboard/components/dashboard/dashboard.component';

describe('SsoCallbackComponent', () => {
  let component: SsoCallbackComponent;
  let fixture: ComponentFixture<SsoCallbackComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [SsoCallbackComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'dashboard', pathMatch: 'full', component: DashboardComponent }])
      ],
      providers: [RouterTestingModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SsoCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
