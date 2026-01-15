import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberPropertyEditorComponent } from './number-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";

describe('NumberPropertyEditorComponent', () => {
  let component: NumberPropertyEditorComponent;
  let fixture: ComponentFixture<NumberPropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NumberPropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberPropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'config',
      {
        label: 'label',
        applyValueCallback: () => {},
        initialValue: null,
        validation: {
          required: false,
          allowNegative: true,
          allowDecimal: true
        }
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
