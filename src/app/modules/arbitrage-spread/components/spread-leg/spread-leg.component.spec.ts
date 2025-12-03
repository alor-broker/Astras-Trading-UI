import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { SpreadLegComponent } from './spread-leg.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { InstrumentSearchMockComponent } from "../../../../shared/utils/testing/instrument-search-mock-component";
import { InputNumberComponent } from "../../../../shared/components/input-number/input-number.component";
import { NzTooltipModule } from "ng-zorro-antd/tooltip";
import { NzEmptyModule } from "ng-zorro-antd/empty";

describe('SpreadLegComponent', () => {
  let component: SpreadLegComponent;
  let fixture: ComponentFixture<SpreadLegComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpreadLegComponent],
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        InstrumentSearchMockComponent,
        InputNumberComponent,
        NzTooltipModule,
        NzEmptyModule
      ],
      providers: [...commonTestProviders]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpreadLegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
