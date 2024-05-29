import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgesSettingsComponent } from './badges-settings.component';

describe('BadgesSettingsComponent', () => {
  let component: BadgesSettingsComponent;
  let fixture: ComponentFixture<BadgesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgesSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
