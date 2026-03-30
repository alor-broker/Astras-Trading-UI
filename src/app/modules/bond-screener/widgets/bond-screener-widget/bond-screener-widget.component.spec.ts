import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BondScreenerWidgetComponent} from './bond-screener-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {BondScreenerComponent} from "../../components/bond-screener/bond-screener.component";
import {YieldCurveChartComponent} from "../../components/yield-curve-chart/yield-curve-chart.component";
import {BondScreenerSettingsComponent} from "../../components/bond-screener-settings/bond-screener-settings.component";

describe('BondScreenerWidgetComponent', () => {
  let component: BondScreenerWidgetComponent;
  let fixture: ComponentFixture<BondScreenerWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        BondScreenerWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          NzTabsComponent,
          NzTabComponent,
          BondScreenerComponent,
          YieldCurveChartComponent,
          BondScreenerSettingsComponent
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            terminalSettingsService: of({})
          }
        }
      ]
    });
    fixture = TestBed.createComponent(BondScreenerWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {
          widgetName: {
            translations: {}
          }
        } as WidgetMeta
      }
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
