import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestIdeasWidgetComponent } from './invest-ideas-widget.component';

describe('InvestIdeasWidgetComponent', () => {
  let component: InvestIdeasWidgetComponent;
  let fixture: ComponentFixture<InvestIdeasWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestIdeasWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestIdeasWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
