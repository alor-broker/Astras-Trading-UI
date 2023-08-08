import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest, filter, Observable, of, Subject, switchMap, take} from 'rxjs';
import {CommandParams} from 'src/app/shared/models/commands/command-params.model';
import {ModalService} from 'src/app/shared/services/modal.service';
import {CommandType} from '../../../../shared/models/enums/command-type.model';
import {NzTabComponent, NzTabSetComponent} from 'ng-zorro-antd/tabs';
import {Instrument} from 'src/app/shared/models/instruments/instrument.model';
import {InstrumentsService} from '../../../instruments/services/instruments.service';
import {map} from 'rxjs/operators';
import {CommandContextModel} from '../../models/command-context.model';
import { Position } from "../../../../shared/models/positions/position.model";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { mapWith } from "../../../../shared/utils/observable-helper";

export enum ComponentTabs {
  LimitOrder = 'limitOrder',
  MarketOrder = 'marketOrder',
  StopOrder = 'stopOrder',
  Notifications = 'notifications'
}

@Component({
  selector: 'ats-command-widget',
  templateUrl: './command-widget.component.html',
  styleUrls: ['./command-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandWidgetComponent implements OnInit {
  readonly componentTabs = ComponentTabs;


  @ViewChild('commandTabs', { static: false }) commandTabs?: NzTabSetComponent;
  @ViewChild('limitTab', { static: false }) limitTab?: NzTabComponent;
  @ViewChild('marketTab', { static: false }) marketTab?: NzTabComponent;
  @ViewChild('stopTab', { static: false }) stopTab?: NzTabComponent;

  isVisible$: Observable<boolean> = of(false);
  commandContext$?: Observable<CommandContextModel<CommandParams>>;
  selectedTab$ = new BehaviorSubject<ComponentTabs>(ComponentTabs.LimitOrder);

  priceChanges$ = new Subject<{ price: number }>();
  qtyChanges$ = new Subject<{ quantity: number }>();
  position$!: Observable<Position | null>;

  constructor(
    private readonly modal: ModalService,
    private readonly instrumentService: InstrumentsService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly currentDashboardService: DashboardContextService,
    ) {
  }

  ngOnInit(): void {
    this.commandContext$ = this.modal.commandParams$.pipe(
      filter((p): p is CommandParams => !!p),
      switchMap(p => combineLatest([
          of(p),
          this.instrumentService.getInstrument(p.instrument)
            .pipe(
              filter((i): i is Instrument => !!i)
            )
        ]
      )),
      map(([params, instrument]) => ({
        commandParameters: params,
        instrument: instrument
      }))
    );

    this.position$ = this.commandContext$.pipe(
      filter(data => !!data),
      mapWith(
        () => this.currentDashboardService.selectedPortfolio$,
        (commandContext, portfolio) => ({ commandContext, portfolio })
      ),
      switchMap(({ commandContext, portfolio }) =>
        this.portfolioSubscriptionsService.getAllPositionsSubscription(portfolio.portfolio, commandContext!.instrument.exchange)
          .pipe(
            map(x => x.find(p => p.symbol === commandContext!.instrument.symbol && p.exchange === commandContext!.instrument.exchange)),
          )
      ),
      filter((p): p is Position => !!p)
    );

    this.isVisible$ = this.modal.shouldShowCommandModal$;
  }

  handleCancel(): void {
    const close = () => this.modal.closeCommandModal();
    close();
  }

  setSelectedTab(tab: ComponentTabs) {
    this.selectedTab$.next(tab);
  }

  openHelp() {
    this.modal.openHelpModal('new-order');
  }

  public setInitialCommandTab() {
    this.commandContext$?.pipe(
      take(1)
    ).subscribe(context => {
      switch (context.commandParameters.type) {
        case CommandType.Limit:
          this.activateCommandTab(this.limitTab);
          this.setSelectedTab(ComponentTabs.LimitOrder);
          break;
        case CommandType.Market:
          this.activateCommandTab(this.marketTab);
          this.setSelectedTab(ComponentTabs.MarketOrder);
          break;
        case CommandType.Stop:
          this.activateCommandTab(this.stopTab);
          this.setSelectedTab(ComponentTabs.StopOrder);
          break;
        default:
          throw new Error(`Unknown command type ${context.commandParameters.type}`);
      }
    });
  }

  isOrderTab(tab: ComponentTabs): boolean {
    return [ComponentTabs.LimitOrder, ComponentTabs.MarketOrder, ComponentTabs.StopOrder].includes(tab);
  }

  toCommandType(tab: ComponentTabs): CommandType | null {
    switch (tab) {
      case ComponentTabs.LimitOrder:
        return CommandType.Limit;
      case ComponentTabs.MarketOrder:
        return CommandType.Market;
      case ComponentTabs.StopOrder:
        return CommandType.Stop;
    }

    return null;
  }

  private activateCommandTab(targetTab?: NzTabComponent) {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    this.commandTabs?.setSelectedIndex(targetTab.position);
  }
}
