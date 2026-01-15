import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketTrendsWidgetComponent } from './market-trends-widget.component';
import {MockComponents, MockProvider} from "ng-mocks";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EMPTY } from "rxjs";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import {MarketTrendsComponent} from "../../components/market-trends/market-trends.component";
import {MarketTrendsSettingsComponent} from "../../components/market-trends-settings/market-trends-settings.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";

describe('MarketTrendsWidgetComponent', () => {
  let component: MarketTrendsWidgetComponent;
  let fixture: ComponentFixture<MarketTrendsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MarketTrendsWidgetComponent,
        MockComponents(
          MarketTrendsComponent,
          MarketTrendsSettingsComponent,
          WidgetSkeletonComponent,
          WidgetHeaderComponent
        )
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY,
            getSettingsOrNull: () => EMPTY,
          }
        ),
        MockProvider(ACTIONS_CONTEXT),
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: () => EMPTY,
          }
        ),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MarketTrendsWidgetComponent);
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
