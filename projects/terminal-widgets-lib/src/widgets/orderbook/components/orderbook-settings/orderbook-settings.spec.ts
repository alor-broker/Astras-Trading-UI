import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {
  ColumnsOrder,
  OrderbookWidgetSettings
} from '../../widget-settings.types';
import {OrderbookSettings} from './orderbook-settings';

describe('OrderbookSettings', () => {
  let settings: OrderbookWidgetSettings;
  let updateSettings: ReturnType<typeof vi.fn>;
  let copyWidget: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    settings = {
      ...InstrumentFixtures.createInstrumentKey({isin: 'RU0009029540', instrumentGroup: 'TQBR'}),
      guid: 'orderbook-widget',
      settingsType: 'OrderbookSettings',
      linkToActive: true,
      badgeColor: 'blue',
      showChart: true,
      showTable: true,
      showYieldForBonds: false
    };
    updateSettings = vi.fn();
    copyWidget = vi.fn();

    TestBed.configureTestingModule({
      imports: [OrderbookSettings],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: vi.fn().mockReturnValue(of(settings)), updateSettings}
        },
        {provide: DesktopManageDashboardsService, useValue: {copyWidget}}
      ]
    });
    TestBed.overrideComponent(OrderbookSettings, {set: {template: '', imports: []}});
  });

  function createComponent(): OrderbookSettings {
    const fixture = TestBed.createComponent(OrderbookSettings);
    fixture.componentRef.setInput('guid', settings.guid);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should save display and order changes as flat settings while preserving the instrument link', () => {
    const component = createComponent();
    const closeRequested = vi.fn();
    component.closeRequested.subscribe(closeRequested);
    component.form.controls.view.setValue({
      depth: 50,
      showChart: false,
      showTable: true,
      showYieldForBonds: true,
      showVolume: true,
      columnsOrder: ColumnsOrder.VolumesAtTheMiddle,
      volumeDisplayFormat: NumberDisplayFormat.LetterSuffix,
      showPriceWithZeroPadding: true
    });
    component.form.controls.orders.controls.useOrderWidget.setValue(true);

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledExactlyOnceWith(settings.guid, {
      symbol: settings.symbol,
      exchange: settings.exchange,
      isin: settings.isin,
      instrumentGroup: settings.instrumentGroup,
      depth: 50,
      showChart: false,
      showTable: true,
      showYieldForBonds: true,
      showVolume: true,
      columnsOrder: ColumnsOrder.VolumesAtTheMiddle,
      volumeDisplayFormat: NumberDisplayFormat.LetterSuffix,
      showPriceWithZeroPadding: true,
      useOrderWidget: true,
      linkToActive: true
    });
    expect(closeRequested).toHaveBeenCalledOnce();
  });

  it('should unlink the widget when its trading board changes', () => {
    const component = createComponent();
    component.form.controls.instrument.controls.instrumentGroup.setValue('SMAL');

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(settings.guid, expect.objectContaining({
      instrumentGroup: 'SMAL',
      linkToActive: false
    }));
  });

  it('should copy edited settings with widget metadata without saving the original', () => {
    const component = createComponent();
    component.form.controls.view.controls.depth.setValue(25);

    component.createWidgetCopy();

    expect(copyWidget).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      ...settings,
      depth: 25
    }));
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('should discard edits on cancel and load saved values when reopened', () => {
    const component = createComponent();
    const closeRequested = vi.fn();
    component.closeRequested.subscribe(closeRequested);
    component.form.controls.view.controls.depth.setValue(30);

    component.requestClose();

    expect(closeRequested).toHaveBeenCalledOnce();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(createComponent().form.controls.view.controls.depth.value).toBe(17);
  });

  it.each([0, 51])('should prevent saving and copying depth %s outside the supported range', depth => {
    const component = createComponent();

    component.form.controls.view.controls.depth.setValue(depth);

    expect(component.canSave).toBe(false);
    expect(component.canCopy).toBe(false);
  });
});
