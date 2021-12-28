import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitCommandComponent } from './limit-command.component';

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitCommandComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
