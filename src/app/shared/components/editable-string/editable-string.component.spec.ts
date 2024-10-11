import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableStringComponent } from './editable-string.component';
import { TranslocoTestsModule } from "../../utils/testing/translocoTestsModule";

describe('EditableStringComponent', () => {
  let component: EditableStringComponent;
  let fixture: ComponentFixture<EditableStringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[TranslocoTestsModule.getModule()],
      declarations: [
        EditableStringComponent,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditableStringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
