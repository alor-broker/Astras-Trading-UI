import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScalperMouseActionsFormComponent} from './scalper-mouse-actions-form.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";

describe('ScalperMouseActionsFormComponent', () => {
  let component: ScalperMouseActionsFormComponent;
  let fixture: ComponentFixture<ScalperMouseActionsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScalperMouseActionsFormComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzTableComponent,
          NzTheadComponent,
          NzTbodyComponent
        ),
        MockDirectives(
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
        )
      ],
      providers: [
        ...commonTestProviders
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperMouseActionsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
