import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookBodyComponent } from './scalper-order-book-body.component';
import { ScalperOrderBookDataContextService } from '../../services/scalper-order-book-data-context.service';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { Subject } from 'rxjs';
import {
  mockComponent,
  ngZorroMockComponents
} from '../../../../shared/utils/testing';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { ScrollingModule } from '@angular/cdk/scrolling';

describe('ScalperOrderBookBodyComponent', () => {
  let component: ScalperOrderBookBodyComponent;
  let fixture: ComponentFixture<ScalperOrderBookBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScrollingModule
      ],
      declarations: [
        ScalperOrderBookBodyComponent,
        mockComponent({ selector: 'ats-trades-panel' }),
        mockComponent({ selector: 'ats-scalper-order-book-table' }),
        mockComponent({ selector: 'ats-orders-indicator', inputs: ['visible']}),
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: ScalperOrderBookDataContextService,
          useValue: {
            createContext: jasmine.createSpy('createContext').and.returnValue({
              extendedSettings$: new Subject(),
              orderBookData$: new Subject(),
              position$: new Subject(),
              currentOrders$: new Subject(),
              currentPortfolio$: new Subject(),
              trades$: new Subject(),
              orderBookBody$: new Subject(),
              displayRange$: new Subject(),
              workingVolume$: new Subject(),
            } as ScalperOrderBookDataContext),
            getOrderBookBounds: jasmine.createSpy('getOrderBookBounds').and.returnValue({
              asksRange: null,
              bidsRange: null
            })
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getLastPrice: jasmine.createSpy('getLastPrice').and.returnValue(new Subject())
          }
        },
        {
          provide: HotKeyCommandService,
          useValue: {
            commands$: new Subject()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
