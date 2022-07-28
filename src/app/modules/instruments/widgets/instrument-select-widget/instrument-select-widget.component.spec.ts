import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSelectWidgetComponent } from './instrument-select-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";

describe('InstrumentSelectWidgetComponent', () => {
  let component: InstrumentSelectWidgetComponent;
  let fixture: ComponentFixture<InstrumentSelectWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InstrumentSelectWidgetComponent,
        mockComponent({
          selector: 'ats-instrument-select',
          inputs: ['guid', 'shouldShowSettings']
        })
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
