import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InstrumentSelectSettingsComponent} from './instrument-select-settings.component';
import {BehaviorSubject} from 'rxjs';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {InstrumentSelectSettings} from '../../models/instrument-select-settings.model';
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {RemoveSelectTitlesDirective} from "../../../../shared/directives/remove-select-titles.directive";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzSelectComponent} from "ng-zorro-antd/select";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {WatchlistCollectionEditComponent} from "../watchlist-collection-edit/watchlist-collection-edit.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('InstrumentSelectSettingsComponent', () => {
  let component: InstrumentSelectSettingsComponent;
  let fixture: ComponentFixture<InstrumentSelectSettingsComponent>;

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InstrumentSelectSettingsComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          WidgetSettingsComponent,
          NzTabsComponent,
          NzTabComponent,
          NzSelectComponent,
          NzSwitchComponent,
          WatchlistCollectionEditComponent
        ),
        MockDirectives(
          RemoveSelectTitlesDirective,
          NzTooltipDirective
        )
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
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
