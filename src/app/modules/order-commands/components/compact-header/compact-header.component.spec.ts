import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CompactHeaderComponent} from './compact-header.component';
import {QuotesService} from "../../../../shared/services/quotes.service";
import {Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('CompactHeaderComponent', () => {
  let component: CompactHeaderComponent;
  let fixture: ComponentFixture<CompactHeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[
        TranslocoTestsModule.getModule(),
        CompactHeaderComponent
      ],
      providers: [
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
    fixture = TestBed.createComponent(CompactHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
