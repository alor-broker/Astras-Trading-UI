import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrderbookTableVolumesAtTheMiddleComponent} from './orderbook-table-volumes-at-the-middle.component';
import {ModalService} from "../../../../../shared/services/modal.service";
import {OrderbookService} from "../../../services/orderbook.service";
import {WidgetSettingsService} from "../../../../../shared/services/widget-settings.service";
import {of, Subject} from "rxjs";
import {InstrumentsService} from '../../../../instruments/services/instruments.service';
import {ThemeService} from '../../../../../shared/services/theme.service';
import {MockComponents, MockDirectives} from "ng-mocks";
import {
  NzCellAlignDirective,
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ShortNumberComponent} from "../../../../../shared/components/short-number/short-number.component";
import {GuidGenerator} from "../../../../../shared/utils/guid";

describe('OrderbookTableVolumesAtTheMiddleComponent', () => {
  let component: OrderbookTableVolumesAtTheMiddleComponent;
  let fixture: ComponentFixture<OrderbookTableVolumesAtTheMiddleComponent>;

  const modalSync = jasmine.createSpyObj('ModalService', ['openCommandModal']);
  const spyOb = jasmine.createSpyObj('OrderbookService', ['getHorizontalOrderBook', 'unsubscribe']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderbookTableVolumesAtTheMiddleComponent,
        MockComponents(
          NzTableComponent,
          NzTheadComponent,
          NzTbodyComponent,
          NzButtonComponent,
          ShortNumberComponent,
        ),
        MockDirectives(
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzCellAlignDirective,
          NzIconDirective
        )
      ],
      providers: [
        {provide: ModalService, useValue: modalSync},
        {provide: OrderbookService, useValue: spyOb},
        {
          provide: InstrumentsService,
          useValue: {getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({}))}
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX',
              showTable: true
            }))
          }
        },
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
          }
        },
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrderbookTableVolumesAtTheMiddleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
