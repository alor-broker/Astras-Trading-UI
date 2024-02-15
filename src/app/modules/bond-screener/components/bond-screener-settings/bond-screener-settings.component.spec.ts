import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondScreenerSettingsComponent } from './bond-screener-settings.component';

describe('BondScreenerSettingsComponent', () => {
  let component: BondScreenerSettingsComponent;
  let fixture: ComponentFixture<BondScreenerSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BondScreenerSettingsComponent]
    });
    fixture = TestBed.createComponent(BondScreenerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
