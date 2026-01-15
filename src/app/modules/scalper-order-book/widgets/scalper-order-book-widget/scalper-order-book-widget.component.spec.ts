import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScalperOrderBookWidgetComponent} from './scalper-order-book-widget.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {of} from 'rxjs';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {
  WidgetHeaderInstrumentSwitchComponent
} from "../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component";
import {ScalperOrderBookComponent} from "../../components/scalper-order-book/scalper-order-book.component";
import {
  ScalperOrderBookSettingsComponent
} from "../../components/scalper-order-book-settings/scalper-order-book-settings.component";

describe('ScalperOrderBookWidgetComponent', () => {
  let component: ScalperOrderBookWidgetComponent;
  let fixture: ComponentFixture<ScalperOrderBookWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScalperOrderBookWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          WidgetHeaderInstrumentSwitchComponent,
          ScalperOrderBookComponent,
          ScalperOrderBookSettingsComponent,
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
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookWidgetComponent);
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
