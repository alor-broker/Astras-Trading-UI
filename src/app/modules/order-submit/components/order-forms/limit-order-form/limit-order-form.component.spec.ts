import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitOrderFormComponent } from './limit-order-form.component';

describe('LimitOrderFormComponent', () => {
  let component: LimitOrderFormComponent;
  let fixture: ComponentFixture<LimitOrderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitOrderFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitOrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
