import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWidgetComponent } from './edit-widget.component';

describe('EditWidgetComponent', () => {
  let component: EditWidgetComponent;
  let fixture: ComponentFixture<EditWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
