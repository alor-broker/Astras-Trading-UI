import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SpreadLegComponent} from './spread-leg.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import {NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {InstrumentSearchComponent} from "../../../../shared/components/instrument-search/instrument-search.component";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('SpreadLegComponent', () => {
  let component: SpreadLegComponent;
  let fixture: ComponentFixture<SpreadLegComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SpreadLegComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzFormItemComponent,
          NzFormControlComponent,
          NzFormLabelComponent,
          InstrumentSearchComponent,
          InputNumberComponent,
          NzSelectComponent,
          NzOptionComponent,
          NzEmptyComponent
        ),
        MockDirectives(
          NzRowDirective,
          NzColDirective,
          NzIconDirective,
          NzTooltipDirective,
        )
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
