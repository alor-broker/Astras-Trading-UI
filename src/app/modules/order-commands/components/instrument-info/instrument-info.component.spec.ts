import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentInfoComponent } from './instrument-info.component';
import {QuotesService} from "../../../../shared/services/quotes.service";
import {Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { MockComponents } from "ng-mocks";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";

describe('InstrumentInfoComponent', () => {
  let component: InstrumentInfoComponent;
  let fixture: ComponentFixture<InstrumentInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule()
      ],
      declarations: [
        InstrumentInfoComponent,
        ...MockComponents(InstrumentIconComponent)
      ],
      providers:[
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getInstrumentPositionSubscription: jasmine.createSpy('getInstrumentPositionSubscription').and.returnValue(new Subject())
          }
        }
      ]
    });
    fixture = TestBed.createComponent(InstrumentInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
