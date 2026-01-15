import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonInfoComponent } from './common-info.component';
import {
  MockComponents,
  MockProviders
} from "ng-mocks";
import { GraphQlService } from "../../../../../shared/services/graph-ql.service";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { RisksComponent } from "../risks/risks.component";

describe('CommonInfoComponent', () => {
  let component: CommonInfoComponent;
  let fixture: ComponentFixture<CommonInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonInfoComponent,
        TranslocoTestsModule.getModule(),
        ...MockComponents(RisksComponent)
      ],
      providers: [
        MockProviders(
          GraphQlService
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonInfoComponent);
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
