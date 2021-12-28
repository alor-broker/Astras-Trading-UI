import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlotterSettingsComponent } from './blotter-settings.component';

describe('BlotterSettingsComponent', () => {
  let component: BlotterSettingsComponent;
  let fixture: ComponentFixture<BlotterSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlotterSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
