import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {
  LightChartWidgetSettings,
  TimeFrameDisplayMode
} from '../../widget-settings.types';
import {LightChartSettingsComponent} from './light-chart-settings';

describe('LightChartSettingsComponent', () => {
  let settings: LightChartWidgetSettings;
  let updateSettings: ReturnType<typeof vi.fn>;
  let copyWidget: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    settings = {
      ...InstrumentFixtures.createInstrumentKey({isin: 'RU0009029540', instrumentGroup: 'TQBR'}),
      guid: 'light-chart-widget',
      settingsType: 'LightChartSettings',
      linkToActive: true,
      timeFrame: TimeframeValue.Day
    };
    updateSettings = vi.fn();
    copyWidget = vi.fn();

    TestBed.configureTestingModule({
      imports: [LightChartSettingsComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: vi.fn().mockReturnValue(of(settings)), updateSettings}
        },
        {provide: DesktopManageDashboardsService, useValue: {copyWidget}}
      ]
    });
    TestBed.overrideComponent(LightChartSettingsComponent, {set: {template: '', imports: []}});
  });

  function createComponent(): LightChartSettingsComponent {
    const fixture = TestBed.createComponent(LightChartSettingsComponent);
    fixture.componentRef.setInput('guid', settings.guid);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should save flat settings with sorted timeframes while preserving the instrument link', () => {
    const component = createComponent();
    component.form.controls.timeframes.setValue({
      availableTimeFrames: [TimeframeValue.Day, TimeframeValue.M1, TimeframeValue.H],
      timeFrame: TimeframeValue.H,
      timeFrameDisplayMode: TimeFrameDisplayMode.Menu
    });

    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledExactlyOnceWith(settings.guid, {
      symbol: settings.symbol,
      exchange: settings.exchange,
      isin: settings.isin,
      instrumentGroup: settings.instrumentGroup,
      linkToActive: true,
      availableTimeFrames: [TimeframeValue.M1, TimeframeValue.H, TimeframeValue.Day],
      timeFrame: TimeframeValue.H,
      timeFrameDisplayMode: TimeFrameDisplayMode.Menu
    });
  });

  it('should choose the longest remaining timeframe when the current one is removed', () => {
    const component = createComponent();
    component.form.controls.timeframes.controls.availableTimeFrames.setValue([TimeframeValue.H, TimeframeValue.M1]);

    component.checkCurrentTimeFrame();
    component.updateSettings();

    expect(updateSettings).toHaveBeenCalledWith(settings.guid, expect.objectContaining({timeFrame: TimeframeValue.H}));
  });

  it('should keep the current timeframe when it is still available', () => {
    const component = createComponent();
    component.form.controls.timeframes.controls.availableTimeFrames.setValue([TimeframeValue.Month, TimeframeValue.Day]);

    component.checkCurrentTimeFrame();

    expect(component.form.controls.timeframes.controls.timeFrame.value).toBe(TimeframeValue.Day);
  });

  it('should prevent saving and copying an empty timeframe selection', () => {
    const component = createComponent();
    component.form.controls.timeframes.controls.availableTimeFrames.setValue([]);

    component.checkCurrentTimeFrame();

    expect(component.canSave).toBe(false);
    expect(component.canCopy).toBe(false);
    expect(component.form.controls.timeframes.controls.timeFrame.value).toBe(TimeframeValue.Day);
  });

  it('should copy edited settings and unlink a changed trading board without saving the original', () => {
    const component = createComponent();
    component.form.controls.instrument.controls.instrumentGroup.setValue('SMAL');
    component.form.controls.timeframes.controls.timeFrameDisplayMode.setValue(TimeFrameDisplayMode.Hide);

    component.createWidgetCopy();

    expect(copyWidget).toHaveBeenCalledExactlyOnceWith({
      ...settings,
      instrumentGroup: 'SMAL',
      linkToActive: false,
      availableTimeFrames: Object.values(TimeframeValue),
      timeFrameDisplayMode: TimeFrameDisplayMode.Hide
    });
    expect(updateSettings).not.toHaveBeenCalled();
  });
});
