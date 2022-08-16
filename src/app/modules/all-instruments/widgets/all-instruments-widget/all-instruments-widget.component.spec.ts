import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsWidgetComponent } from './all-instruments-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";
import { EventEmitter } from "@angular/core";

describe('AllInstrumentsWidgetComponent', () => {
  let component: AllInstrumentsWidgetComponent;
  let fixture: ComponentFixture<AllInstrumentsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsWidgetComponent,
        mockComponent({
          selector: 'ats-all-instruments',
          inputs: ['guid', 'contentSize']
        })
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsWidgetComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
