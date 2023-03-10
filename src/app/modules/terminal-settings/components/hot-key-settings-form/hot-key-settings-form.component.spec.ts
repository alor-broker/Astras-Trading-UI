import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotKeySettingsFormComponent } from './hot-key-settings-form.component';
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('HotKeySettingsFormComponent', () => {
  let component: HotKeySettingsFormComponent;
  let fixture: ComponentFixture<HotKeySettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        NoopAnimationsModule,
        ...sharedModuleImportForTests
      ],
      declarations: [
        HotKeySettingsFormComponent,
        mockComponent({selector: 'nz-divider'})
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotKeySettingsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
