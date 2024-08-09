import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperMouseActionsFormComponent } from './scalper-mouse-actions-form.component';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ScalperMouseActionsFormComponent', () => {
  let component: ScalperMouseActionsFormComponent;
  let fixture: ComponentFixture<ScalperMouseActionsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        ...sharedModuleImportForTests,
        NoopAnimationsModule
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
