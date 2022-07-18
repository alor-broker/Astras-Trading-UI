import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPickerInputComponent } from './color-picker-input.component';

describe('ColorPickerInputComponent', () => {
  let component: ColorPickerInputComponent;
  let fixture: ComponentFixture<ColorPickerInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ColorPickerInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorPickerInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
