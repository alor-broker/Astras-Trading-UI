import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {GlobalLoadingIndicatorService} from "./shared/services/global-loading-indicator.service";
import {Subject} from "rxjs";
import {APP_HOOK} from "./shared/services/hook/app/app-hook-token";
import {MockComponents} from "ng-mocks";
import {NzSpinComponent} from "ng-zorro-antd/spin";

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        AppComponent,
        MockComponents(
          NzSpinComponent
        )
      ],
      providers: [
        {provide: APP_HOOK, useValue: []},
        {
          provide: GlobalLoadingIndicatorService,
          useValue: {
            isLoading$: new Subject()
          }
        },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
