import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { BaseTableComponent } from './base-table.component';
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { ACTIONS_CONTEXT, ActionsContext } from "../../services/actions-context";
import { BehaviorSubject, Observable, of } from "rxjs";
import { getRandomInt } from "../../utils/testing";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { TableConfig } from "../../models/table-config.model";

@Component({
  selector: 'ats-test-comp',
  template: ''
})
class TestComponent extends BaseTableComponent<any, any>{
  protected initTableConfigStream(): Observable<TableConfig<any>> {
    return of({ columns: [] });
  }

  protected initTableDataStream(): Observable<any[]> {
    return of([]);
  }
}

@Component({
  template: '<ats-test-comp></ats-test-comp>'
})
class TestWrapperComponent {}

describe('BaseTableComponent', () => {
  let hostComponent: TestWrapperComponent;
  let component: TestComponent;
  let hostFixture: ComponentFixture<TestWrapperComponent>;

  let settingsServiceSpy: any;

  beforeEach(() => {
    settingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['updateSettings']);

    TestBed.configureTestingModule({
      declarations: [
        TestComponent,
        TestWrapperComponent
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: settingsServiceSpy
        }
      ]
    });

    hostFixture = TestBed.createComponent(TestWrapperComponent);
    hostComponent = hostFixture.componentInstance;
    component = hostFixture.debugElement.query(By.directive(TestComponent)).componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
