import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookSettingsComponent } from './scalper-order-book-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { NzSliderModule } from "ng-zorro-antd/slider";

describe('ScalperOrderBookSettingsComponent', () => {
  let component: ScalperOrderBookSettingsComponent;
  let fixture: ComponentFixture<ScalperOrderBookSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookSettingsComponent
      ],
      imports: [
        getTranslocoModule(),
        NoopAnimationsModule,
        NzSliderModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX'
            })),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
