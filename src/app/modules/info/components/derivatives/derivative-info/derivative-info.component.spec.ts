import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { DerivativeInfoComponent } from './derivative-info.component';
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { MockProvider } from "ng-mocks";
import { GraphQlService } from "../../../../../shared/services/graph-ql.service";

describe('DerivativeInfoComponent', () => {
  let component: DerivativeInfoComponent;
  let fixture: ComponentFixture<DerivativeInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DerivativeInfoComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(GraphQlService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DerivativeInfoComponent);
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
