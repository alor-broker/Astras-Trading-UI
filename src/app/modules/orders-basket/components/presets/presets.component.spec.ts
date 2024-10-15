import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetsComponent } from './presets.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('PresetsComponent', () => {
  let component: PresetsComponent;
  let fixture: ComponentFixture<PresetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        PresetsComponent,
        ...ngZorroMockComponents
      ]
    });
    fixture = TestBed.createComponent(PresetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
