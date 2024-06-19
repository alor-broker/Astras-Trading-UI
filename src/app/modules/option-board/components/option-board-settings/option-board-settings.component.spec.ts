import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OptionBoardSettingsComponent } from './option-board-settings.component';
import {
  getTranslocoModule,
  InstrumentSearchMockComponent,
  mockComponent
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { ReactiveFormsModule } from "@angular/forms";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzFormModule } from "ng-zorro-antd/form";

describe('OptionBoardSettingsComponent', () => {
  let component: OptionBoardSettingsComponent;
  let fixture: ComponentFixture<OptionBoardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        ReactiveFormsModule,
        NzSelectModule,
        NzCollapseModule,
        NzFormModule
      ],
      declarations: [
        OptionBoardSettingsComponent,
        InstrumentSearchMockComponent,
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['instrument', 'placeholder'] }),
        mockComponent({ selector: 'ats-instrument-search' }),
        mockComponent({
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
