import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { DashboardService } from './dashboard.service';
import { WidgetFactoryService } from './widget-factory.service';
import { LocalStorageService } from "./local-storage.service";
import { WidgetSettingsService } from "./widget-settings.service";
import { take } from "rxjs";
import { WidgetNames } from "../models/enums/widget-names";

describe('DashboardService', () => {
  let service: DashboardService;
  const factorySpy = jasmine.createSpyObj('WidgetFactoryService', {
    createNewSettings: {testProp: 'test'}
  });
  const widgetSettingsSpy = jasmine.createSpyObj('WidgetSettingsService', ['addSettings', 'removeSettings', 'removeAllSettings']);
  let localStorageServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem']);

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        {
          provide: WidgetSettingsService,
          useValue: widgetSettingsSpy
        },
        { provide: WidgetFactoryService, useValue: factorySpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
      ]
    });
    service = TestBed.inject(DashboardService);
    service.reloadPage = () => null;

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add widget', fakeAsync(() => {
    const widget = {
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test1'}
    };

    service.addWidget(widget);
    expect(factorySpy.createNewSettings).toHaveBeenCalledWith(widget, undefined);
    expect(widgetSettingsSpy.addSettings).toHaveBeenCalledWith([{testProp: 'test'}]);

    widget.gridItem.label = 'test2';
    service.addWidget(widget);

    service.dashboard$.pipe(take(1))
      .subscribe(res => {
        const expected = new Map([
          ['test1', {guid: 'test1', gridItem: widget.gridItem, hasSettings: true, hasHelp: true}],
          ['test2', {guid: 'test2', gridItem: widget.gridItem, hasSettings: true, hasHelp: true}],
        ]);
        expect(res).toEqual(expected);
      });

    tick();

    expect(factorySpy.createNewSettings).toHaveBeenCalledWith(widget, undefined);
    expect(widgetSettingsSpy.addSettings).toHaveBeenCalledWith([{testProp: 'test'}]);
    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(
      'dashboards',
      [
        ['test1', {guid: 'test1', gridItem: widget.gridItem, hasSettings: true, hasHelp: true}],
        ['test2', {guid: 'test2', gridItem: widget.gridItem, hasSettings: true, hasHelp: true}]
      ]
    );
  }));

  it('should remove one widget', fakeAsync(() => {
    const widget = {
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test1'}
    };
    service.addWidget(widget);
    widget.gridItem.label = 'test2';
    service.addWidget(widget);

    service.removeWidget('test1');

    service.dashboard$.pipe(take(1))
      .subscribe(res => {
        const expected = new Map([['test2', {
          guid: 'test2',
          ...widget,
          hasSettings: true,
          hasHelp: true
        }]]);
        expect(res).toEqual(expected);
      });

    tick();

    expect(widgetSettingsSpy.removeSettings).toHaveBeenCalledOnceWith('test1');
    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith('dashboards', [[
      'test2', {
        guid: 'test2',
        ...widget,
        hasSettings: true,
        hasHelp: true
      }
      ]]);
  }));

  it('should clear dashboard', fakeAsync(() => {
    service.addWidget({gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test1'}});
    service.addWidget({gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test2'}});
    service.addWidget({gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test3'}});

    service.clearDashboard();
    service.dashboard$.pipe(take(1))
      .subscribe(res => {
        const expected = new Map();
        expect(res).toEqual(expected);
      });
    tick();

    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('dashboards');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('terminalSettings');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('watchlistCollection');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('portfolio');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('profile');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('feedback');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('instruments');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('feedback');
    expect(widgetSettingsSpy.removeAllSettings).toHaveBeenCalled();
  }));

  it('should reset dashboard', fakeAsync(() => {
    const clearDashboardSpy = spyOn(service, 'clearDashboard').and.callThrough();
    const addWidgetSpy = spyOn(service, 'addWidget').and.callThrough();

    service.resetDashboard();
    tick(1000);

    expect(clearDashboardSpy).toHaveBeenCalled();
    expect(addWidgetSpy).toHaveBeenCalledTimes(6);
    expect(addWidgetSpy).toHaveBeenCalledWith({gridItem: {x: 0, y: 0, cols: 30, rows: 18, type: WidgetNames.lightChart}});
    expect(addWidgetSpy).toHaveBeenCalledWith({gridItem: {x: 30, y: 0, cols: 10, rows: 18, type: WidgetNames.orderBook}}, {depth: 10});
    expect(addWidgetSpy).toHaveBeenCalledWith({gridItem: {x: 40, y: 0, cols: 10, rows: 18, type: WidgetNames.instrumentInfo}});
    expect(addWidgetSpy).toHaveBeenCalledWith({gridItem: {x: 0, y: 18, cols: 25, rows: 12, type: WidgetNames.blotter}}, {activeTabIndex: 3});
    expect(addWidgetSpy).toHaveBeenCalledWith({gridItem: {x: 25, y: 18, cols: 15, rows: 12, type: WidgetNames.blotter}}, {activeTabIndex: 0});
    expect(addWidgetSpy).toHaveBeenCalledWith({gridItem: {x: 40, y: 18, cols: 10, rows: 12, type: WidgetNames.instrumentSelect}});
  }));

  it('should save dashboard', fakeAsync(() => {
    const widgets = [
      {gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test1'}},
      {gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test2'}},
      {gridItem: {x: 0, y: 0, rows: 1, cols: 1, label: 'test3'}},
    ];

    widgets.forEach(widget => service.addWidget(widget));

    service.saveDashboard('default');
    service.dashboard$.pipe(take(1))
      .subscribe(res => {
        const expected = new Map(widgets.map(widget => ([
          widget.gridItem.label, {guid: widget.gridItem.label, gridItem: widget.gridItem, hasSettings: true, hasHelp: true}
        ])));
        expect(res).toEqual(expected);
      });

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(
      'dashboards',
      widgets.map(widget => ([
        widget.gridItem.label, {
          guid: widget.gridItem.label,
          gridItem: widget.gridItem,
          hasSettings: true,
          hasHelp: true
        }
      ]))
    );
  }));
});
