import {TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {OrderSubmitWidgetSettings} from '../../widget-settings.types';
import {OrderSubmitSettings} from './order-submit-settings';

describe('OrderSubmitSettings', () => {
  let settings: OrderSubmitWidgetSettings;
  let settings$: BehaviorSubject<OrderSubmitWidgetSettings>;
  let updateSettings: ReturnType<typeof vi.fn>;
  let copyWidget: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    settings = {
      ...InstrumentFixtures.createInstrumentKey({isin: 'RU0009029540', instrumentGroup: 'TQBR'}),
      guid: 'order-submit-widget',
      settingsType: 'OrderSubmitSettings',
      linkToActive: true,
      defaultOrderType: 'stop',
      enableLimitOrdersFastEditing: true,
      skipMarginOrderConfirmation: true,
      limitOrderPriceMoveSteps: [5, 1],
      showVolumePanel: true,
      workingVolumes: [10, 1]
    };
    settings$ = new BehaviorSubject(settings);
    updateSettings = vi.fn();
    copyWidget = vi.fn();
    TestBed.configureTestingModule({
      imports: [OrderSubmitSettings],
      providers: [
        {provide: WidgetSettingsService, useValue: {getSettings: vi.fn().mockReturnValue(settings$), updateSettings}},
        {provide: DesktopManageDashboardsService, useValue: {copyWidget}}
      ]
    });
    TestBed.overrideComponent(OrderSubmitSettings, {set: {template: '', imports: []}});
  });

  afterEach(() => {
    settings$.complete();
  });

  function createComponent(): OrderSubmitSettings {
    const fixture = TestBed.createComponent(OrderSubmitSettings);
    fixture.componentRef.setInput('guid', settings.guid);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should save flat settings and preserve the instrument link and default order type', () => {
    const component = createComponent();
    component.form.controls.fastEditing.controls.enableLimitOrdersFastEditing.setValue(false);
    component.form.controls.volumes.controls.workingVolumes.at(0).setValue(3);

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledExactlyOnceWith(settings.guid, {
      symbol: settings.symbol,
      exchange: settings.exchange,
      isin: settings.isin,
      instrumentGroup: settings.instrumentGroup,
      defaultOrderType: 'stop',
      enableLimitOrdersFastEditing: false,
      skipMarginOrderConfirmation: false,
      limitOrderPriceMoveSteps: [1, 5],
      showVolumePanel: true,
      workingVolumes: [3, 10],
      linkToActive: true
    });
  });

  it('should replace numeric rows when saved settings are emitted again', () => {
    const component = createComponent();

    settings$.next({...settings, limitOrderPriceMoveSteps: [10, 2], workingVolumes: [20]});

    expect(component.form.controls.fastEditing.controls.limitOrderPriceMoveSteps.value).toEqual([2, 10]);
    expect(component.form.controls.volumes.controls.workingVolumes.value).toEqual([20]);
    expect(settings.limitOrderPriceMoveSteps).toEqual([5, 1]);
  });

  it('should unlink the widget when the trading board changes', () => {
    const component = createComponent();
    component.form.controls.instrument.controls.instrumentGroup.setValue('SMAL');

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(settings.guid, expect.objectContaining({
      instrumentGroup: 'SMAL', linkToActive: false
    }));
  });

  it('should copy edited values without saving the original widget', () => {
    const component = createComponent();
    component.form.controls.volumes.controls.workingVolumes.at(0).setValue(7);

    component.createWidgetCopy();

    expect(copyWidget).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      ...settings, limitOrderPriceMoveSteps: [1, 5], workingVolumes: [7, 10]
    }));
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('should discard edits on cancel and reload saved settings when reopened', () => {
    const component = createComponent();
    const closeRequested = vi.fn();
    component.closeRequested.subscribe(closeRequested);
    component.form.controls.volumes.controls.showVolumePanel.setValue(false);

    component.requestClose();

    expect(closeRequested).toHaveBeenCalledOnce();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(createComponent().form.controls.volumes.controls.showVolumePanel.value).toBe(true);
  });

  it.each([null, 0, 201])('should prevent saving and copying an invalid price step %s', value => {
    const component = createComponent();

    component.form.controls.fastEditing.controls.limitOrderPriceMoveSteps.at(0).setValue(value);

    expect(component.canSave).toBe(false);
    expect(component.canCopy).toBe(false);
  });

  it('should allow adding the first price step and working volume to empty saved lists', () => {
    settings$.next({...settings, limitOrderPriceMoveSteps: [], workingVolumes: []});
    const component = createComponent();

    component.addLimitOrderPriceMoveStep(new MouseEvent('click'));
    component.addWorkingVolume(new MouseEvent('click'));

    expect(component.form.controls.fastEditing.controls.limitOrderPriceMoveSteps.value).toEqual([1]);
    expect(component.form.controls.volumes.controls.workingVolumes.value).toEqual([1]);
    expect(component.canSave).toBe(true);
  });
});
