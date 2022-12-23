import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPickerInputComponent } from './color-picker-input.component';
import { getTranslocoModule, ngZorroMockComponents } from "../../utils/testing";
import ruColorPickerInput from "../../../../assets/i18n/shared/color-picker-input/ru.json";

describe('ColorPickerInputComponent', () => {
  let component: ColorPickerInputComponent;
  let fixture: ComponentFixture<ColorPickerInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ColorPickerInputComponent,
        ...ngZorroMockComponents
      ],
      imports: [
        getTranslocoModule({
          langs: {
            'shared/color-picker-input/ru': ruColorPickerInput,
          }
        }),
      ]
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
