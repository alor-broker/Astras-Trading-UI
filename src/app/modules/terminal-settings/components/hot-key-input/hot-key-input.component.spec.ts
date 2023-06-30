import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotKeyInputComponent } from './hot-key-input.component';
import { ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('HotKeyInputComponent', () => {
  let component: HotKeyInputComponent;
  let fixture: ComponentFixture<HotKeyInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        HotKeyInputComponent,
        ngZorroMockComponents
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
