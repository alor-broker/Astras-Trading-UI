import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondScreenerSettingsComponent } from './bond-screener-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { commonTestProviders, getTranslocoModule, sharedModuleImportForTests } from "../../../../shared/utils/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe('BondScreenerSettingsComponent', () => {
  let component: BondScreenerSettingsComponent;
  let fixture: ComponentFixture<BondScreenerSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BondScreenerSettingsComponent],
      imports: [
        NoopAnimationsModule,
        getTranslocoModule(),
        ...sharedModuleImportForTests,
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough()
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
    });
    fixture = TestBed.createComponent(BondScreenerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
