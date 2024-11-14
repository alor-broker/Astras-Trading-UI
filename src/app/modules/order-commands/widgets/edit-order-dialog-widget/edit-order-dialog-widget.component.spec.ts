import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { EditOrderDialogWidgetComponent } from './edit-order-dialog-widget.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('EditOrderDialogWidgetComponent', () => {
  let component: EditOrderDialogWidgetComponent;
  let fixture: ComponentFixture<EditOrderDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [EditOrderDialogWidgetComponent]
    });
    fixture = TestBed.createComponent(EditOrderDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
