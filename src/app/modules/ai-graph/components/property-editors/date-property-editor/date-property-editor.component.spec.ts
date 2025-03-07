import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePropertyEditorComponent } from './date-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";

describe('DatePropertyEditorComponent', () => {
  let component: DatePropertyEditorComponent;
  let fixture: ComponentFixture<DatePropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DatePropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatePropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
