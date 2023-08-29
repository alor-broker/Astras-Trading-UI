import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { InfoService } from '../../services/info.service';

import { InfoWidgetComponent } from './info-widget.component';
import {
  getTranslocoModule,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

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
        getTranslocoModule()
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
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        }
      ]
    })
      .compileComponents();

    TestBed.overrideComponent(InfoWidgetComponent, {
      set: {
        providers: [
          { provide: InfoService, useValue: infoSpy }
        ]
      }
    });
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
