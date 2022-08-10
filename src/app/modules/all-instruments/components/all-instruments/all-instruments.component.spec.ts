import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsComponent } from './all-instruments.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import { mockComponent } from "../../../../shared/utils/testing";
import { EventEmitter } from "@angular/core";

describe('AllInstrumentsComponent', () => {
  let component: AllInstrumentsComponent;
  let fixture: ComponentFixture<AllInstrumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsComponent,
        mockComponent({
          selector: 'ats-infinite-scroll-table',
          inputs: [
            'tableContainerHeight',
            'tableContainerWidth',
            'data',
            'isLoading',
            'columns'
          ],
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        {
          provide: AllInstrumentsService,
          useValue: {
            getAllInstruments: jasmine.createSpy('getAllInstruments').and.returnValue(of([]))
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
