import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpreadLegComponent } from './spread-leg.component';

describe('SpreadLegComponent', () => {
  let component: SpreadLegComponent;
  let fixture: ComponentFixture<SpreadLegComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpreadLegComponent]
    });
    fixture = TestBed.createComponent(SpreadLegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
