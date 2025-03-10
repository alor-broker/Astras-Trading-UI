import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanPropertyEditorComponent } from './boolean-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";

describe('BooleanPropertyEditorComponent', () => {
  let component: BooleanPropertyEditorComponent;
  let fixture: ComponentFixture<BooleanPropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BooleanPropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BooleanPropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
