import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { InstrumentsService } from '../../services/instruments.service';

import { InstrumentSelectWidgetComponent } from './instrument-select-widget.component';

describe('InstrumentSelectWidgetComponent', () => {
  let component: InstrumentSelectWidgetComponent;
  let fixture: ComponentFixture<InstrumentSelectWidgetComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['settings$', 'setSettings']);
  spyInstrs.settings$ = of(null);
  spyInstrs.setSettings.and.returnValue();
  const spyDash = jasmine.createSpyObj('DashboardService', ['updateWidget']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstrumentSelectWidgetComponent ],
      providers: [
        { provide: InstrumentsService, useValue: spyInstrs },
        { provide: DashboardService, useValue: spyDash },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
