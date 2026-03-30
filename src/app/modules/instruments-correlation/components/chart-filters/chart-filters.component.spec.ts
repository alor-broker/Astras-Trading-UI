import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ChartFiltersComponent} from './chart-filters.component';
import {WatchlistCollectionService} from "../../../instruments/services/watchlist-collection.service";
import {Subject} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('ChartFiltersComponent', () => {
  let component: ChartFiltersComponent;
  let fixture: ComponentFixture<ChartFiltersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        ...FormsTesting.getMocks(),
        ChartFiltersComponent
      ],
      providers: [
        {
          provide: WatchlistCollectionService,
          useValue: {
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    });
    fixture = TestBed.createComponent(ChartFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
