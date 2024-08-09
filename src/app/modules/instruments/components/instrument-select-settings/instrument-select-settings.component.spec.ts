import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSelectSettingsComponent } from './instrument-select-settings.component';
import { BehaviorSubject } from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { InstrumentsModule } from "../../instruments.module";

describe('InstrumentSelectSettingsComponent', () => {
  let component: InstrumentSelectSettingsComponent;
  let fixture: ComponentFixture<InstrumentSelectSettingsComponent>;

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InstrumentSelectSettingsComponent,
        ...ngZorroMockComponents,
        mockComponent({
          selector: 'ats-watchlist-collection-edit'
        }),
        mockComponent({
          selector: 'ats-widget-settings',
          inputs: ['canSave', 'canCopy', 'showCopy']
        })
      ],
      imports: [
        InstrumentsModule,
        ...sharedModuleImportForTests,
        NoopAnimationsModule,
        getTranslocoModule()
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock),
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
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
