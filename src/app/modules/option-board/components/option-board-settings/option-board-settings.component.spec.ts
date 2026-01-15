import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OptionBoardSettingsComponent} from './option-board-settings.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents} from "ng-mocks";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {InstrumentSearchComponent} from "../../../../shared/components/instrument-search/instrument-search.component";
import {
  InstrumentBoardSelectComponent
} from "../../../../shared/components/instrument-board-select/instrument-board-select.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OptionBoardSettingsComponent', () => {
  let component: OptionBoardSettingsComponent;
  let fixture: ComponentFixture<OptionBoardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OptionBoardSettingsComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          WidgetSettingsComponent,
          InstrumentSearchComponent,
          InstrumentBoardSelectComponent
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OptionBoardSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
