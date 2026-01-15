import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableStringComponent } from './editable-string.component';
import {TranslocoTestsModule} from "../../utils/testing/translocoTestsModule";

describe('EditableStringComponent', () => {
  let component: EditableStringComponent;
  let fixture: ComponentFixture<EditableStringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        EditableStringComponent,
        TranslocoTestsModule.getModule()
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditableStringComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('content', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
