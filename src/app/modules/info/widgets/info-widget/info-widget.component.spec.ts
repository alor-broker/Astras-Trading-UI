import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InfoWidgetComponent} from './info-widget.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {EMPTY, of} from 'rxjs';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockProvider} from "ng-mocks";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {
  WidgetHeaderInstrumentSwitchComponent
} from "../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {InfoHeaderComponent} from "../../components/common/info-header/info-header.component";
import {StockInfoComponent} from "../../components/stocks/stock-info/stock-info.component";
import {BondInfoComponent} from "../../components/bonds/bond-info/bond-info.component";
import {DerivativeInfoComponent} from "../../components/derivatives/derivative-info/derivative-info.component";
import {CommonInfoComponent} from "../../components/common/common-info/common-info.component";

describe('InfoWidgetComponent', () => {
  let component: InfoWidgetComponent;
  let fixture: ComponentFixture<InfoWidgetComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getExchangeInfo', 'init']);
  infoSpy.getExchangeInfo.and.returnValue(null);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        InfoWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          WidgetHeaderInstrumentSwitchComponent,
          NzSpinComponent,
          InfoHeaderComponent,
          StockInfoComponent,
          BondInfoComponent,
          DerivativeInfoComponent,
          CommonInfoComponent,
        )
      ],
      providers: [
        MockProvider(WidgetSettingsService, {
          getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
          getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
          addSettings: jasmine.createSpy('addSettings').and.callThrough()
        }),
        MockProvider(TerminalSettingsService, {
          getSettings: () => of({})
        }),
        MockProvider(DashboardContextService, {
          instrumentsSelection$: of({})
        }),
        MockProvider(InstrumentsService, {
          getInstrument: () => EMPTY
        })
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoWidgetComponent);
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

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
