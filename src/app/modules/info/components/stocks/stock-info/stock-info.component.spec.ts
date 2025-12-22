import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { StockInfoComponent } from './stock-info.component';
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { MockProvider } from "ng-mocks";
import { GraphQlService } from "../../../../../shared/services/graph-ql.service";

describe('StockInfoComponent', () => {
  let component: StockInfoComponent;
  let fixture: ComponentFixture<StockInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StockInfoComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(GraphQlService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StockInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'instrumentKey',
      {
        symbol: 'SYMB',
        exchange: 'EXCH',
        board: ''
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
