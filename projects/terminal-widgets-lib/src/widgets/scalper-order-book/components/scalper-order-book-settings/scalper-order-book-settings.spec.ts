import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {ScalperOrderBookSettingsReadService} from '../../services/scalper-order-book-settings-read.service';
import {ScalperOrderBookSettingsWriteService} from '../../services/scalper-order-book-settings-write.service';
import {
  PriceUnits,
  ScalperOrderBookWidgetSettings,
  TradesClusterHighlightMode,
  VolumeHighlightMode
} from '../../widget-settings.types';
import {ScalperOrderBookSettings} from './scalper-order-book-settings';

describe('ScalperOrderBookSettings', () => {
  let initialSettings: ScalperOrderBookWidgetSettings;
  let writeService: {
    updateInstrumentLinkedSettings: ReturnType<typeof vi.fn>;
    updateWidgetSettings: ReturnType<typeof vi.fn>;
  };
  let copyWidget: ReturnType<typeof vi.fn>;
  let genericUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    initialSettings = {
      ...InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
      guid: 'scalper-settings-test',
      linkToActive: true,
      showZeroVolumeItems: true,
      showSpreadItems: true,
      disableHotkeys: true,
      enableMouseClickSilentOrders: false,
      workingVolumes: [10, 100],
      volumeHighlightMode: VolumeHighlightMode.VolumeBoundsWithFixedValue,
      volumeHighlightOptions: [{boundary: 100, color: '#ff0000'}],
      layout: {widths: {orderBook: 200}},
      bracketsSettings: {orderPriceUnits: PriceUnits.Percents, topOrderPriceRatio: 1.5}
    };
    writeService = {
      updateInstrumentLinkedSettings: vi.fn(),
      updateWidgetSettings: vi.fn()
    };
    copyWidget = vi.fn();
    genericUpdate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {provide: WidgetSettingsService, useValue: {updateSettings: genericUpdate}},
        {provide: DesktopManageDashboardsService, useValue: {copyWidget}},
        {
          provide: ScalperOrderBookSettingsReadService,
          useValue: {readSettings: vi.fn().mockReturnValue(of({widgetSettings: initialSettings}))}
        },
        {provide: ScalperOrderBookSettingsWriteService, useValue: writeService}
      ]
    });
    // Exercise form lifecycle and persistence independently of the modal and market-data UI.
    TestBed.overrideComponent(ScalperOrderBookSettings, {set: {template: '', imports: []}});
  });

  function createEditor(): ScalperOrderBookSettings {
    const fixture = TestBed.createComponent(ScalperOrderBookSettings);
    fixture.componentRef.setInput('guid', initialSettings.guid);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should save nested values through the scalper writer and close after saving', () => {
    const editor = createEditor();
    const closed = vi.spyOn(editor.closeRequested, 'emit');
    editor.form.controls.display.controls.depth.setValue(25);
    editor.form.controls.volumes.controls.workingVolumes.at(1).setValue(250);
    editor.form.controls.highlight.controls.volumeHighlightOptions.at(0).controls.boundary.setValue(500);
    editor.form.controls.automation.controls.bracketsSettings.controls.topOrderPriceRatio.setValue(2.5);

    editor.updateSettings();

    const expectedValues = {
      depth: 25,
      workingVolumes: [10, 250],
      volumeHighlightOptions: [{boundary: 500, color: '#ff0000'}],
      bracketsSettings: expect.objectContaining({orderPriceUnits: PriceUnits.Percents, topOrderPriceRatio: 2.5}),
      layout: initialSettings.layout
    };
    expect(writeService.updateInstrumentLinkedSettings).toHaveBeenCalledWith(
      expect.objectContaining(expectedValues),
      expect.objectContaining(InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}))
    );
    expect(writeService.updateWidgetSettings).toHaveBeenCalledWith(
      expect.objectContaining({...expectedValues, linkToActive: true}), initialSettings.guid
    );
    expect(genericUpdate).not.toHaveBeenCalled();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('should copy edited settings without writing shared settings or closing the editor', () => {
    const editor = createEditor();
    const closed = vi.spyOn(editor.closeRequested, 'emit');
    editor.form.controls.instrument.controls.instrument.setValue(InstrumentFixtures.createInstrumentKey({symbol: 'GAZP'}));
    editor.form.controls.table.controls.fontSize.setValue(14);

    editor.createWidgetCopy();

    expect(copyWidget).toHaveBeenCalledWith(expect.objectContaining({
      guid: initialSettings.guid,
      symbol: 'GAZP',
      fontSize: 14,
      workingVolumes: initialSettings.workingVolumes,
      linkToActive: false
    }));
    expect(writeService.updateInstrumentLinkedSettings).not.toHaveBeenCalled();
    expect(writeService.updateWidgetSettings).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });

  it('should discard changes when closing without saving', () => {
    const editor = createEditor();
    const closed = vi.spyOn(editor.closeRequested, 'emit');
    editor.form.controls.volumes.controls.workingVolumes.at(0).setValue(99);

    editor.requestClose();

    expect(closed).toHaveBeenCalledOnce();
    expect(initialSettings.workingVolumes).toEqual([10, 100]);
    expect(writeService.updateInstrumentLinkedSettings).not.toHaveBeenCalled();
    expect(writeService.updateWidgetSettings).not.toHaveBeenCalled();
  });

  it('should block invalid thresholds only while their highlight mode is enabled', () => {
    const editor = createEditor();
    const highlight = editor.form.controls.highlight;
    highlight.controls.volumeHighlightOptions.at(0).controls.boundary.setValue(0);

    editor.updateSettings();

    expect(highlight.valid).toBe(false);
    expect(editor.canSave).toBe(false);
    expect(writeService.updateWidgetSettings).not.toHaveBeenCalled();

    highlight.controls.volumeHighlightMode.setValue(VolumeHighlightMode.Off);

    expect(highlight.valid).toBe(true);
    expect(editor.canSave).toBe(true);

    highlight.controls.volumeHighlightMode.setValue(VolumeHighlightMode.VolumeBoundsWithFixedValue);

    expect(editor.canSave).toBe(false);
  });

  it('should exclude an invalid cluster target from group validity when it is hidden', () => {
    const editor = createEditor();
    const panels = editor.form.controls.panels;
    const clusters = panels.controls.tradesClusterPanelSettings;
    panels.controls.showTradesClustersPanel.setValue(true);
    clusters.controls.highlightMode.setValue(TradesClusterHighlightMode.TargetVolume);
    clusters.controls.targetVolume.setValue(0);
    expect(panels.valid).toBe(false);

    clusters.controls.highlightMode.setValue(TradesClusterHighlightMode.Off);

    expect(clusters.controls.targetVolume.disabled).toBe(true);
    expect(panels.valid).toBe(true);
    expect(editor.canSave).toBe(true);
  });
});
