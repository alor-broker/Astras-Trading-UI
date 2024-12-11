import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergedBadgeComponent } from './merged-badge.component';

describe('MergedBadgeComponent', () => {
  let component: MergedBadgeComponent;
  let fixture: ComponentFixture<MergedBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergedBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MergedBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
