import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingVolumesComponent } from './working-volumes.component';
import { getTranslocoModule, ngZorroMockComponents } from '../../../../shared/utils/testing';
import {QuotesService} from "../../../../shared/services/quotes.service";
import {Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {SubscriptionsDataFeedService} from "../../../../shared/services/subscriptions-data-feed.service";

describe('WorkingVolumesComponent', () => {
  let component: WorkingVolumesComponent;
  let fixture: ComponentFixture<WorkingVolumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ...ngZorroMockComponents,
        WorkingVolumesComponent
      ],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingVolumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
