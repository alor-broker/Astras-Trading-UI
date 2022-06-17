import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTradesComponent } from './all-trades.component';
import { AllTradesService } from "../../services/all-trades.service";
import { of } from "rxjs";
import { EventEmitter } from "@angular/core";

describe('AllTradesComponent', () => {
  let component: AllTradesComponent;
  let fixture: ComponentFixture<AllTradesComponent>;

  const settingsMock = {exchange: 'testEx', symbol: 'testSy'};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllTradesComponent ],
      providers: [
        {
          provide: AllTradesService,
          useValue: {
            getSettingsSub: jasmine.createSpy('getSettingsSub').and.returnValue(of(settingsMock)),
            getTradesList: jasmine.createSpy('getTradesList').and.returnValue(of([])),
            getAllTradesSub: jasmine.createSpy('getAllTradesSub').and.returnValue(of({})),
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
