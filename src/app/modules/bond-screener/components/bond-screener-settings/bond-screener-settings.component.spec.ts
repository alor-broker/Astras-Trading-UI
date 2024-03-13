import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondScreenerSettingsComponent } from './bond-screener-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

describe('BondScreenerSettingsComponent', () => {
  let component: BondScreenerSettingsComponent;
  let fixture: ComponentFixture<BondScreenerSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BondScreenerSettingsComponent],
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
        }
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
