import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionsTablePageComponent } from './positions-table-page.component';

describe('PositionsTablePageComponent', () => {
  let component: PositionsTablePageComponent;
  let fixture: ComponentFixture<PositionsTablePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PositionsTablePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionsTablePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
