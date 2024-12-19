import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBadgeDisplayComponent } from './instrument-badge-display.component';
import {DashboardContextService} from "../../services/dashboard-context.service";
import {Subject} from "rxjs";
import {TerminalSettingsService} from "../../services/terminal-settings.service";

describe('InstrumentBadgeDisplayComponent', () => {
  let component: InstrumentBadgeDisplayComponent;
  let fixture: ComponentFixture<InstrumentBadgeDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentBadgeDisplayComponent],
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: new Subject()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentBadgeDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
