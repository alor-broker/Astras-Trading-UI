import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsWidgetComponent } from './all-instruments-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";

describe('AllInstrumentsWidgetComponent', () => {
  let component: AllInstrumentsWidgetComponent;
  let fixture: ComponentFixture<AllInstrumentsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsWidgetComponent,
        mockComponent({
          selector: 'ats-all-instruments',
          inputs: ['guid', 'resize']
        })
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
