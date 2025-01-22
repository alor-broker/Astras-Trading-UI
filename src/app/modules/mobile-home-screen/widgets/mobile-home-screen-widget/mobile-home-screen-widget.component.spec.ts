import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileHomeScreenWidgetComponent } from './mobile-home-screen-widget.component';

describe('MobileHomeScreenWidgetComponent', () => {
  let component: MobileHomeScreenWidgetComponent;
  let fixture: ComponentFixture<MobileHomeScreenWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileHomeScreenWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileHomeScreenWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
