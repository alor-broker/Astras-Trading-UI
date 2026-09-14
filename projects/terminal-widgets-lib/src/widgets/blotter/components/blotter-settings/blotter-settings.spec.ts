import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {USER_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {PUSH_NOTIFICATIONS_CONFIG} from '@terminal-core-lib/features/push-notifications/types/push-notifications-config.types';
import {BlotterWidgetSettings} from '../../widget-settings.types';
import {BlotterSettings} from './blotter-settings';

describe('BlotterSettings', () => {
  let settings: BlotterWidgetSettings;
  let updateSettings: ReturnType<typeof vi.fn>;
  let copyWidget: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    settings = {
      ...PortfolioFixtures.createPortfolioKey(),
      guid: 'blotter-widget',
      settingsType: 'BlotterSettings',
      activeTabIndex: 0,
      linkToActive: true,
      isSoldPositionsHidden: true,
      ordersColumns: ['symbol'],
      stopOrdersColumns: ['symbol'],
      positionsColumns: ['symbol'],
      tradesColumns: ['symbol'],
      repoTradesTable: {columns: [{columnId: 'symbol', columnWidth: 180, columnOrder: 2}]}
    };
    updateSettings = vi.fn();
    copyWidget = vi.fn();

    TestBed.configureTestingModule({
      imports: [BlotterSettings],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: vi.fn().mockReturnValue(of(settings)), updateSettings}
        },
        {provide: DesktopManageDashboardsService, useValue: {copyWidget}},
        {provide: PortfoliosStoreFacade, useValue: {portfolios$: of([])}},
        {provide: USER_CONTEXT, useValue: {getUser: vi.fn().mockReturnValue(of(null))}},
        {
          provide: PUSH_NOTIFICATIONS_CONFIG,
          useValue: {
            priceChangeNotifications: {isSupported: true},
            portfolioOrdersExecuteNotifications: {isSupported: true}
          }
        }
      ]
    });
    TestBed.overrideComponent(BlotterSettings, {set: {template: '', imports: []}});
  });

  function createComponent(): BlotterSettings {
    const fixture = TestBed.createComponent(BlotterSettings);
    fixture.componentRef.setInput('guid', settings.guid);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should save flat settings and preserve existing column dimensions without persisting form fields', () => {
    const component = createComponent();
    component.form.controls.general.controls.showSummary.setValue(false);
    component.form.controls.trades.controls.showRepoTrades.setValue(true);
    component.form.controls.trades.controls.repoTradesColumns.setValue(['symbol', 'qty']);

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledExactlyOnceWith(settings.guid, {
      portfolio: settings.portfolio,
      exchange: settings.exchange,
      showSummary: false,
      showOrders: true,
      showStopOrders: true,
      cancelOrdersWithoutConfirmation: false,
      showPositions: true,
      showPositionActions: false,
      isSoldPositionsHidden: true,
      showTrades: true,
      showRepoTrades: true,
      showHistoryTrades: true,
      showNotifications: true,
      ordersTable: {columns: [{columnId: 'symbol', columnWidth: null}]},
      stopOrdersTable: {columns: [{columnId: 'symbol', columnWidth: null}]},
      positionsTable: {columns: [{columnId: 'symbol', columnWidth: null}]},
      tradesTable: {columns: [{columnId: 'symbol', columnWidth: null}]},
      repoTradesTable: {
        columns: [{columnId: 'symbol', columnWidth: 180, columnOrder: 2}, {columnId: 'qty', columnWidth: null}]
      },
      tradesHistoryTable: expect.objectContaining({columns: expect.any(Array)}),
      notificationsTable: expect.objectContaining({columns: expect.any(Array)}),
      linkToActive: true
    });
  });

  it('should unlink the widget when its portfolio changes and handle clearing the selection', () => {
    const component = createComponent();
    component.form.controls.general.controls.portfolio.setValue('another:MOEX');
    component.portfolioChanged('another:MOEX');

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(settings.guid, expect.objectContaining({
      portfolio: 'another', exchange: 'MOEX', linkToActive: false
    }));
    expect(() => component.portfolioChanged(null)).not.toThrow();
    expect(component.form.controls.general.controls.exchange.value).toBe('');
  });

  it('should copy edited settings without saving the original', () => {
    const component = createComponent();
    component.form.controls.positions.controls.isSoldPositionsHidden.setValue(false);

    component.createWidgetCopy();

    expect(copyWidget).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      guid: settings.guid,
      settingsType: settings.settingsType,
      portfolio: settings.portfolio,
      isSoldPositionsHidden: false
    }));
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('should discard edits on cancel and restore saved settings on reopening', () => {
    const component = createComponent();
    const closeRequested = vi.fn();
    component.closeRequested.subscribe(closeRequested);
    component.form.controls.general.controls.showSummary.setValue(false);

    component.requestClose();

    expect(closeRequested).toHaveBeenCalledOnce();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(createComponent().form.controls.general.controls.showSummary.value).toBe(true);
  });
});
