import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AllInstrumentsComponent} from './all-instruments.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY, of, Subject} from "rxjs";
import {AllInstrumentsService} from "../../services/all-instruments.service";
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {TranslatorService} from '../../../../shared/services/translator.service';
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {BoardsService} from "../../services/boards.service";
import {LetDirective} from "@ngrx/component";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzContextMenuService} from "ng-zorro-antd/dropdown";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {NavigationStackService} from "../../../../shared/services/navigation-stack.service";
import {MockComponents} from "ng-mocks";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {
  InfiniteScrollTableComponent
} from "../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component";

describe('AllInstrumentsComponent', () => {
  let component: AllInstrumentsComponent;
  let fixture: ComponentFixture<AllInstrumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LetDirective,
        AllInstrumentsComponent,
        MockComponents(
          InfiniteScrollTableComponent,
          AddToWatchlistMenuComponent
        )
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
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: new Subject(),
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(new Subject())
          }
        },
        {
          provide: BoardsService,
          useValue: {
            getAllBoards: jasmine.createSpy('getAllBoards').and.returnValue(new Subject())
          }
        },
        {
          provide: NzModalService,
          useValue: {
            warning: jasmine.createSpy('warning').and.callThrough()
          }
        },
        {
          provide: NavigationStackService,
          useValue: {
            currentState$: EMPTY
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'guid',
      'testGuid'
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
