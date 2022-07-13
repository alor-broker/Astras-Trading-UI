import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { VerticalOrderBookComponent } from './vertical-order-book.component';
import { of } from "rxjs";
import { OrderbookService } from "../../services/orderbook.service";
import { VerticalOrderBook } from "../../models/vertical-order-book.model";
import { sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('VerticalOrderBookComponent', () => {
  let component: VerticalOrderBookComponent;
  let fixture: ComponentFixture<VerticalOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerticalOrderBookComponent],
      imports: [...sharedModuleImportForTests],
      providers: [
        {
          provide: OrderbookService,
          useValue: {
            getVerticalOrderBook: jasmine.createSpy('getVerticalOrderBook').and.returnValue(of({
              asks: [],
              bids: [],
              spreadItems: []
            } as VerticalOrderBook))
          }
        },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticalOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
