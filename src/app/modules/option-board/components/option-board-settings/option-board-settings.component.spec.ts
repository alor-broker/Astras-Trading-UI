import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OptionBoardSettingsComponent } from './option-board-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { ReactiveFormsModule } from "@angular/forms";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzFormModule } from "ng-zorro-antd/form";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { InstrumentSearchMockComponent } from "../../../../shared/utils/testing/instrument-search-mock-component";
import { InstrumentBoardSelectMockComponent } from "../../../../shared/utils/testing/instrument-board-select-mock-component";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('OptionBoardSettingsComponent', () => {
  let component: OptionBoardSettingsComponent;
  let fixture: ComponentFixture<OptionBoardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        TranslocoTestsModule.getModule(),
        ReactiveFormsModule,
        NzSelectModule,
        NzCollapseModule,
        NzFormModule,
        InstrumentSearchMockComponent,
        InstrumentBoardSelectMockComponent
      ],
      declarations: [
        OptionBoardSettingsComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-widget-settings',
          inputs: ['canSave', 'canCopy', 'showCopy']
        })
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
