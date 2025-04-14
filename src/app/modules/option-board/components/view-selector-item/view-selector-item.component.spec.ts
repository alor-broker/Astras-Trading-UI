import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSelectorItemComponent } from './view-selector-item.component';

describe('ViewSelectorItemComponent', () => {
  let component: ViewSelectorItemComponent;
  let fixture: ComponentFixture<ViewSelectorItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewSelectorItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSelectorItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
