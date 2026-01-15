import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondInfoComponent } from './bond-info.component';
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { MockProviders } from "ng-mocks";
import { GraphQlService } from "../../../../../shared/services/graph-ql.service";

describe('BondInfoComponent', () => {
  let component: BondInfoComponent;
  let fixture: ComponentFixture<BondInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BondInfoComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProviders(
          GraphQlService
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondInfoComponent);
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
