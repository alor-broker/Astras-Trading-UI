import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ArbitrageSpreadWidgetComponent} from './arbitrage-spread-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {ArbitrageSpreadTableComponent} from "../../components/arbitrage-spread-table/arbitrage-spread-table.component";
import {
  ArbitrageSpreadModalWidgetComponent
} from "../arbitrage-spread-modal-widget/arbitrage-spread-modal-widget.component";

describe('ArbitrageSpreadWidgetComponent', () => {
  let component: ArbitrageSpreadWidgetComponent;
  let fixture: ComponentFixture<ArbitrageSpreadWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ArbitrageSpreadWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          ArbitrageSpreadTableComponent,
          ArbitrageSpreadModalWidgetComponent
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadWidgetComponent);
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
