import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitCommandSettingsComponent } from './limit-command-settings.component';

describe('LimitCommandSettingsComponent', () => {
  let component: LimitCommandSettingsComponent;
  let fixture: ComponentFixture<LimitCommandSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitCommandSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitCommandSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
