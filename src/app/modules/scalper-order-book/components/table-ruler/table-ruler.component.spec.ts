import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableRulerComponent } from './table-ruler.component';
import { Subject } from 'rxjs';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';

describe('TableRulerComponent', () => {
  let component: TableRulerComponent;
  let fixture: ComponentFixture<TableRulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableRulerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableRulerComponent);
    component = fixture.componentInstance;
    component.dataContext = {
      extendedSettings$: new Subject(),
      orderBookData$: new Subject(),
      position$: new Subject(),
      currentOrders$: new Subject(),
      currentPortfolio$: new Subject(),
      trades$: new Subject(),
      orderBookBody$: new Subject(),
      displayRange$: new Subject(),
      workingVolume$: new Subject(),
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
