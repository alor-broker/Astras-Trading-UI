import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringPropertyEditorComponent } from './string-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";

describe('StringPropertyEditorComponent', () => {
  let component: StringPropertyEditorComponent;
  let fixture: ComponentFixture<StringPropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StringPropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StringPropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
