import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSelectorComponent } from './view-selector.component';

describe('ViewSelectorComponent', () => {
  let component: ViewSelectorComponent;
  let fixture: ComponentFixture<ViewSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
