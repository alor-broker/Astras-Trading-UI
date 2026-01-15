import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ImportWatchlistDialogComponent} from './import-watchlist-dialog.component';
import {WatchlistCollectionService} from "../../services/watchlist-collection.service";
import {Subject} from "rxjs";
import {MarketService} from "../../../../shared/services/market.service";
import {InstrumentsService} from "../../services/instruments.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {NzUploadComponent} from "ng-zorro-antd/upload";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzSpinComponent} from "ng-zorro-antd/spin";

describe('ImportWatchlistDialogComponent', () => {
  let component: ImportWatchlistDialogComponent;
  let fixture: ComponentFixture<ImportWatchlistDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ImportWatchlistDialogComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzModalComponent,
          NzUploadComponent,
          NzButtonComponent,
          NzTableComponent,
          NzTheadComponent,
          NzTbodyComponent,
          NzTypographyComponent,
          NzSpinComponent
        ),
        MockDirectives(
          NzModalContentDirective,
          NzTooltipDirective,
          NzIconDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzModalFooterDirective
        )
      ],
      providers: [
        {
          provide: MarketService,
          useValue: {
            getDefaultExchange: jasmine.createSpy('getDefaultExchange').and.returnValue(new Subject())
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: WatchlistCollectionService,
          useValue: {
            addItemsToList: jasmine.createSpy('addItemsToList').and.callThrough()
          }
        }
      ]
    });
    fixture = TestBed.createComponent(ImportWatchlistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
