import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptPropertyEditorComponent } from './prompt-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";

describe('PromptPropertyEditorComponent', () => {
  let component: PromptPropertyEditorComponent;
  let fixture: ComponentFixture<PromptPropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PromptPropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromptPropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
