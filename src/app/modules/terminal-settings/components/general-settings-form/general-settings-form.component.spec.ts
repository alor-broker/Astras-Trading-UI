import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { GeneralSettingsFormComponent } from './general-settings-form.component';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('GeneralSettingsFormComponent', () => {
  let component: GeneralSettingsFormComponent;
  let fixture: ComponentFixture<GeneralSettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        NoopAnimationsModule,
        ...sharedModuleImportForTests
      ],
      declarations: [
        GeneralSettingsFormComponent
      ],
      providers: [
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralSettingsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
