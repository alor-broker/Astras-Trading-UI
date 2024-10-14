import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotKeyInputComponent } from './hot-key-input.component';
import { ReactiveFormsModule } from "@angular/forms";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('HotKeyInputComponent', () => {
  let component: HotKeyInputComponent;
  let fixture: ComponentFixture<HotKeyInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        HotKeyInputComponent,
        ...ngZorroMockComponents
      ],
      imports: [
        ReactiveFormsModule,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotKeyInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
