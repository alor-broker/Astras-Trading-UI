import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InstrumentsCorrelationWidgetComponent} from './instruments-correlation-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {CorrelationChartComponent} from "../../components/correlation-chart/correlation-chart.component";

describe('InstrumentsCorrelationWidgetComponent', () => {
  let component: InstrumentsCorrelationWidgetComponent;
  let fixture: ComponentFixture<InstrumentsCorrelationWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        InstrumentsCorrelationWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          CorrelationChartComponent
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
        }
      ]
    });
    fixture = TestBed.createComponent(InstrumentsCorrelationWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
