import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextPropertyEditorComponent } from './text-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";

describe('TextPropertyEditorComponent', () => {
  let component: TextPropertyEditorComponent;
  let fixture: ComponentFixture<TextPropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TextPropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextPropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
