import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoService } from '../../../services/info.service';

import { CalendarComponent } from './calendar.component';
import { of } from "rxjs";
import { ComponentHelpers } from "../../../../../shared/utils/testing/component-helpers";

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getCalendar', 'getExchangeInfo']);
  infoSpy.getCalendar.and.returnValue(null);
  infoSpy.getExchangeInfo.and.returnValue(of({}));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CalendarComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-loading-indicator',
          inputs: ['isLoading']
        })
      ],
      providers: [
        { provide: InfoService, useValue: infoSpy}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
