import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InfoWidgetComponent } from './info-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import {
  EMPTY,
  of
} from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { MockProvider } from "ng-mocks";
import { InstrumentsService } from "../../../instruments/services/instruments.service";

describe('InfoWidgetComponent', () => {
  let component: InfoWidgetComponent;
  let fixture: ComponentFixture<InfoWidgetComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getExchangeInfo', 'init']);
  infoSpy.getExchangeInfo.and.returnValue(null);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InfoWidgetComponent,
        widgetSkeletonMock
      ],
      imports: [
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        ),
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: () => of({})
          }
        ),
        MockProvider(
          DashboardContextService,
          {
            instrumentsSelection$: of({})
          }
        ),
        MockProvider(
          InstrumentsService,
          {
            getInstrument: () => EMPTY
          }
        )
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
