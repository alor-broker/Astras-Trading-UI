import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { LightChartSettingsComponent } from './light-chart-settings.component';
import { of } from 'rxjs';
import {
  getTranslocoModule,
  InstrumentSearchMockComponent,
  mockComponent
} from '../../../../shared/utils/testing';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { LightChartSettings } from '../../models/light-chart-settings.model';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from "@angular/forms";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import {
  Component,
  forwardRef,
  Input
} from "@angular/core";
import { NzFormModule } from "ng-zorro-antd/form";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TimeframeValue } from "../../models/light-chart.models";

describe('LightChartSettingsComponent', () => {
  let component: LightChartSettingsComponent;
  let fixture: ComponentFixture<LightChartSettingsComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getBars']);
  spy.getBars.and.returnValue(of([]));

  const settings: LightChartSettings = {
    timeFrame: TimeframeValue.Day,
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LightChartSettingsComponent,
        InstrumentSearchMockComponent,
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['instrument', 'placeholder'] }),
        mockComponent({
          selector: 'ats-widget-settings',
          inputs: ['canSave', 'canCopy', 'showCopy']
        })
      ],
      imports: [
        getTranslocoModule(),
        ReactiveFormsModule,
        NzSelectModule,
        NzCollapseModule,
        NzFormModule
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settings)),
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
