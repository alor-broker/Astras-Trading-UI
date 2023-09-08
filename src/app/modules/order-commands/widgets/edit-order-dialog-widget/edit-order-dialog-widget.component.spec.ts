import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOrderDialogWidgetComponent } from './edit-order-dialog-widget.component';

describe('EditOrderDialogWidgetComponent', () => {
  let component: EditOrderDialogWidgetComponent;
  let fixture: ComponentFixture<EditOrderDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
