import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LazyLoadingBaseTableComponent } from './lazy-loading-base-table.component';
import { Component } from "@angular/core";
import { Observable, of } from "rxjs";
import { TableConfig } from "../../models/table-config.model";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { By } from "@angular/platform-browser";
import { BaseColumnSettings } from "../../models/settings/table-settings.model";

@Component({
    selector: 'ats-test-comp',
    template: ''
})
class TestComponent extends LazyLoadingBaseTableComponent<any, any> {
  protected allColumns: BaseColumnSettings<any>[] = [];

  protected initTableConfigStream(): Observable<TableConfig<any>> {
    return of({ columns: [] });
  }

  protected initTableDataStream(): Observable<any[]> {
    return of([]);
  }
}

@Component({
  imports: [
    TestComponent
  ],
  template: '<ats-test-comp />'
})
class TestWrapperComponent {}

describe('LazyLoadingBaseTableComponent', () => {
  let component: TestComponent;
  let hostFixture: ComponentFixture<TestWrapperComponent>;

  let settingsServiceSpy: any;

  beforeEach(() => {
    settingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['updateSettings']);

    TestBed.configureTestingModule({
    imports: [TestComponent,
        TestWrapperComponent],
    providers: [
        {
            provide: WidgetSettingsService,
            useValue: settingsServiceSpy
        }
    ]
});

    hostFixture = TestBed.createComponent(TestWrapperComponent);
    component = hostFixture.debugElement.query(By.directive(TestComponent)).componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
