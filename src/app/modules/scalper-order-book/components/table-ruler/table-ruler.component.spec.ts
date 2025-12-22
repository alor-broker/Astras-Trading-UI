import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TableRulerComponent} from './table-ruler.component';
import {BehaviorSubject, Subject} from 'rxjs';
import {ScalperOrderBookDataContext} from '../../models/scalper-order-book-data-context.model';
import {SCALPER_ORDERBOOK_BODY_REF} from '../scalper-order-book-body/scalper-order-book-body.component';

describe('TableRulerComponent', () => {
  let component: TableRulerComponent;
  let fixture: ComponentFixture<TableRulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableRulerComponent],
      providers: [
        {
          provide: SCALPER_ORDERBOOK_BODY_REF,
          useValue: {
            getElement: jasmine.createSpy('getElement').and.returnValue({
              nativeElement: jasmine.createSpy('nativeElement').and.returnValue({
                x: 0
              })
            })
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableRulerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'dataContext',
      {
        extendedSettings$: new Subject(),
        orderBook$: new Subject(),
        position$: new Subject(),
        currentOrders$: new Subject(),
        currentPortfolio$: new Subject(),
        trades$: new Subject(),
        ownTrades$: new Subject(),
        orderBookBody$: new Subject(),
        displayRange$: new Subject(),
        workingVolume$: new Subject(),
        scaleFactor$: new BehaviorSubject(1),
        addLocalOrder: () => {
        },
        removeLocalOrder: () => {
        },
        destroy: () => {
        }
      } as ScalperOrderBookDataContext
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
