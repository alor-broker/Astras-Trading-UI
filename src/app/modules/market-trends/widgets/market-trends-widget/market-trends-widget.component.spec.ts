import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketTrendsWidgetComponent } from './market-trends-widget.component';
import { MockProvider } from "ng-mocks";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EMPTY } from "rxjs";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";

describe('MarketTrendsWidgetComponent', () => {
  let component: MarketTrendsWidgetComponent;
  let fixture: ComponentFixture<MarketTrendsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketTrendsWidgetComponent],
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
    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
