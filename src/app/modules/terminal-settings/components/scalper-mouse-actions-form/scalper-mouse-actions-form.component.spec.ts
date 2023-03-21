import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScalperMouseActionsFormComponent } from './scalper-mouse-actions-form.component';
import {
  commonTestProviders,
  getTranslocoModule,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TerminalSettingsModule } from '../../terminal-settings.module';

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
