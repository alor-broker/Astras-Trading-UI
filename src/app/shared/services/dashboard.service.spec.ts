import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { DashboardService } from './dashboard.service';
import { WidgetFactoryService } from './widget-factory.service';
import { LocalStorageService } from "./local-storage.service";
import { WidgetSettingsService } from "./widget-settings.service";
import { take } from "rxjs";

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

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith('dashboards', []);
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('dashboards');
    expect(widgetSettingsSpy.removeAllSettings).toHaveBeenCalled();
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('profile');
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
