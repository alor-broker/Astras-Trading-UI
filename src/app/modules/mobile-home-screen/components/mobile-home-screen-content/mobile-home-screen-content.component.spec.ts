import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileHomeScreenContentComponent } from './mobile-home-screen-content.component';

describe('MobileHomeScreenContentComponent', () => {
  let component: MobileHomeScreenContentComponent;
  let fixture: ComponentFixture<MobileHomeScreenContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileHomeScreenContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileHomeScreenContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
