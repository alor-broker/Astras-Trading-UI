import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { NewsWidgetComponent } from './news-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('NewsWidgetComponent', () => {
  let component: NewsWidgetComponent;
  let fixture: ComponentFixture<NewsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NewsWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-news',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-news-settings',
          inputs: ['guid']
        }),
        widgetSkeletonMock
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
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            terminalSettingsService: of({})
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('addSettings').and.returnValue(of({}))
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('ru')
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {widgetName: {}} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
