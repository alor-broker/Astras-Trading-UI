import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperMouseActionsFormComponent } from './scalper-mouse-actions-form.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";

describe('ScalperMouseActionsFormComponent', () => {
  let component: ScalperMouseActionsFormComponent;
  let fixture: ComponentFixture<ScalperMouseActionsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules()
      ],
      declarations: [
        ScalperMouseActionsFormComponent
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
