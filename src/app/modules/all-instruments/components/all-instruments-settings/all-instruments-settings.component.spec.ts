import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsSettingsComponent } from './all-instruments-settings.component';

describe('AllInstrumentsSettingsComponent', () => {
  let component: AllInstrumentsSettingsComponent;
  let fixture: ComponentFixture<AllInstrumentsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllInstrumentsSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
