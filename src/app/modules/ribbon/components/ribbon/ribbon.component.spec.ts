import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RibbonComponent} from './ribbon.component';
import {mockComponent} from "../../../../shared/utils/testing";
import {HistoryService} from "../../../../shared/services/history.service";
import {Subject} from "rxjs";

describe('RibbonComponent', () => {
  let component: RibbonComponent;
  let fixture: ComponentFixture<RibbonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        RibbonComponent,
        mockComponent({selector: 'ats-scrollable-row'}),
      ],
      providers: [
        {
          provide: HistoryService,
          useValue: {
            getLastTwoCandles: jasmine.createSpy('getLastTwoCandles').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RibbonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
