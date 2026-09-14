import {TestBed} from '@angular/core/testing';
import {Observable, of} from 'rxjs';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DEFAULT_RIBBON_ITEMS, RibbonLayout, RibbonWidgetSettings} from '../../widget-settings.types';
import {RibbonSettings} from './ribbon-settings';
import {MarketServiceMockFactory} from '@testing-lib/angular/market-service.mock';

describe('RibbonSettings', () => {
  let initial: RibbonWidgetSettings;
  let updateSettings: ReturnType<typeof vi.fn>;
  let market: ReturnType<typeof MarketServiceMockFactory.create>;

  beforeEach(() => {
    initial = {guid: 'ribbon-test', displayItems: []};
    updateSettings = vi.fn();
    market = MarketServiceMockFactory.create();
    TestBed.configureTestingModule({
      providers: [market.provider, {
        provide: WidgetSettingsService,
        useValue: {getSettings: (): Observable<RibbonWidgetSettings> => of(initial), updateSettings}
      }]
    }).overrideComponent(RibbonSettings, {set: {template: '', imports: []}});
  });

  function createEditor(): RibbonSettings {
    const fixture = TestBed.createComponent(RibbonSettings);
    fixture.componentRef.setInput('guid', initial.guid);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should save renamed instruments in the selected order without changing persisted settings before saving', () => {
    const original = InstrumentFixtures.createInstrumentKey();
    initial.displayItems = [{...original, displayName: 'Original'}];
    const editor = createEditor();

    editor.items()[0].displayName.setValue('  My bank  ');
    editor.addInstrument(InstrumentFixtures.createInstrumentKey({symbol: 'LKOH'}));
    editor.moveItem(1, -1);

    expect(initial.displayItems).toEqual([{...original, displayName: 'Original'}]);
    expect(updateSettings).not.toHaveBeenCalled();

    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 60,
      displayItems: [
        expect.objectContaining({symbol: 'LKOH'}),
        expect.objectContaining({symbol: 'SBER', displayName: 'My bank'})
      ]
    });
  });

  it('should reject duplicates while preserving instruments from different boards', () => {
    const editor = createEditor();
    const instrument = InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'});

    editor.addInstrument(instrument);
    editor.addInstrument({...instrument});

    expect(editor.duplicate()).toBe(true);
    expect(editor.items()).toHaveLength(1);

    editor.addInstrument({...instrument, instrumentGroup: 'SMAL'});

    expect(editor.items()).toHaveLength(2);
  });

  it('should add a futures base code without instrument search and preserve its case and custom name', () => {
    const editor = createEditor();
    editor.futuresCode.setValue(' Si ');

    editor.addFutures();
    editor.items()[0].displayName.setValue('USD futures');
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 60,
      displayItems: [{symbol: 'Si', exchange: 'MOEX', isFutures: true, displayName: 'USD futures'}]
    });
  });

  it('should reject invalid futures codes and ignore an empty search selection', () => {
    const editor = createEditor();

    for (const code of ['', '  ', 'BR-9.26', 'BR GOLD', 'БР']) {
      editor.futuresCode.setValue(code);
      editor.addFutures();
    }
    editor.addInstrument(null);

    expect(editor.items()).toEqual([]);
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('should use defaults for legacy settings and restore independent editable copies', () => {
    initial.displayItems = undefined;
    const editor = createEditor();

    editor.items()[0].displayName.setValue('Custom');
    editor.removeItem(1);
    editor.restoreDefaults();
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 60,
      displayItems: DEFAULT_RIBBON_ITEMS.map(item => ({...item, displayName: item.displayName}))
    });
    expect(initial.displayItems).toBeUndefined();
  });

  it('should preserve an intentionally empty list and cancel edits without saving', () => {
    const editor = createEditor();
    expect(editor.items()).toEqual([]);

    editor.addInstrument(InstrumentFixtures.createInstrumentKey());
    editor.requestClose();

    expect(updateSettings).not.toHaveBeenCalled();
    expect(initial.displayItems).toEqual([]);

    editor.removeItem(0);
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 60,displayItems: []});
  });

  it('should select the only configured exchange even without isDefault', () => {
    market.service.getMarketSettings.mockReturnValue(of({
      exchanges: [{exchange: 'ONLY', settings: {}}]
    }));

    const editor = createEditor();

    expect(editor.exchanges()).toEqual(['ONLY']);
    expect(editor.exchangeControl.value).toBe('ONLY');
  });

  it('should select isDefault and save the exchange chosen by the user', () => {
    market.service.getMarketSettings.mockReturnValue(of({
      exchanges: [
        {exchange: 'FIRST', settings: {}},
        {exchange: 'DEFAULT', settings: {isDefault: true}}
      ]
    }));
    const editor = createEditor();
    expect(editor.exchangeControl.value).toBe('DEFAULT');

    editor.exchangeControl.setValue('FIRST');
    editor.futuresCode.setValue('BR');
    editor.addFutures();
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 60,
      displayItems: [expect.objectContaining({symbol: 'BR', exchange: 'FIRST', isFutures: true})]
    });
  });

  it('should require a configured exchange when several values have no default', () => {
    market.service.getMarketSettings.mockReturnValue(of({
      exchanges: [{exchange: 'FIRST', settings: {}}, {exchange: 'SECOND', settings: {}}]
    }));
    const editor = createEditor();
    expect(editor.exchangeControl.value).toBeNull();

    editor.futuresCode.setValue('BR');
    editor.addFutures();
    editor.exchangeControl.setValue('UNKNOWN');
    editor.addFutures();

    expect(editor.items()).toEqual([]);
  });

  it('should restore the display name when inline editing is cancelled', () => {
    initial.displayItems = [{...InstrumentFixtures.createInstrumentKey(), displayName: 'Original'}];
    const editor = createEditor();
    const item = editor.items()[0];

    editor.startNameEdit(item);
    item.displayName.setValue('Changed');
    editor.finishNameEdit(true);

    expect(item.displayName.value).toBe('Original');
    expect(editor.nameEdit()).toBeNull();
  });

  it('should default to a single row for existing settings without a layout', () => {
    const editor = createEditor();

    expect(editor.appearanceForm.controls.layout.value).toBe(RibbonLayout.SingleRow);
  });

  it('should save a two-row layout without changing persisted settings before saving', () => {
    const editor = createEditor();
    editor.appearanceForm.controls.layout.setValue(RibbonLayout.TwoRows);

    expect(initial.layout).toBeUndefined();
    expect(updateSettings).not.toHaveBeenCalled();
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {
      layout: RibbonLayout.TwoRows, refreshIntervalSec: 60, displayItems: []
    });
  });

  it('should load a saved two-row layout and allow switching back to a single row', () => {
    initial.layout = RibbonLayout.TwoRows;
    const editor = createEditor();
    expect(editor.appearanceForm.controls.layout.value).toBe(RibbonLayout.TwoRows);

    editor.appearanceForm.controls.layout.setValue(RibbonLayout.SingleRow);
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {
      layout: RibbonLayout.SingleRow, refreshIntervalSec: 60, displayItems: []
    });
  });

  it('should load and save a custom refresh interval', () => {
    initial.refreshIntervalSec = 120;
    const editor = createEditor();
    expect(editor.refreshForm.controls.refreshIntervalSec.value).toBe(120);

    editor.refreshForm.controls.refreshIntervalSec.setValue(30);
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 30, displayItems: []});
  });

  it('should default to 60 seconds and validate the refresh interval boundaries', () => {
    const editor = createEditor();
    const control = editor.refreshForm.controls.refreshIntervalSec;
    expect(control.value).toBe(60);

    for (const interval of [5, 300]) {
      control.setValue(interval);
      expect(editor.canSave).toBe(true);
    }
    for (const interval of [4, 301]) {
      control.setValue(interval);
      expect(editor.canSave).toBe(false);
    }
  });

  it('should remove a previous display name when the user clears it', () => {
    initial.displayItems = [{...InstrumentFixtures.createInstrumentKey(), displayName: 'Old name'}];
    const editor = createEditor();

    editor.items()[0].displayName.setValue('   ');
    editor.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(initial.guid, {layout: RibbonLayout.SingleRow, refreshIntervalSec: 60,
      displayItems: [expect.objectContaining({symbol: 'SBER', displayName: undefined})]
    });
  });
});
