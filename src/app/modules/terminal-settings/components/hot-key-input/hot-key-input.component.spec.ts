import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotKeyInputComponent } from './hot-key-input.component';
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";
import { ReactiveFormsModule } from "@angular/forms";

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
        getTranslocoModule()
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
