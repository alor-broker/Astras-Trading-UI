import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSelectSettingsComponent } from './instrument-select-settings.component';

describe('InstrumentSelectSettingsComponent', () => {
  let component: InstrumentSelectSettingsComponent;
  let fixture: ComponentFixture<InstrumentSelectSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstrumentSelectSettingsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
