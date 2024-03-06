import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { BaseTableComponent } from './base-table.component';
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { ACTIONS_CONTEXT, ActionsContext } from "../../services/actions-context";
import { BehaviorSubject } from "rxjs";
import { getRandomInt } from "../../utils/testing";
import { CdkDragDrop } from "@angular/cdk/drag-drop";

@Component({
  selector: 'ats-test-comp',
  template: ''
})
class TestComponent extends BaseTableComponent<any, { id: string }>{
  protected initTableConfig(): void {
    return;
  }

  protected initTableData(): void {
    return;
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
    settingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['getSettings', 'updateSettings']);

    TestBed.configureTestingModule({
      declarations: [
        TestComponent,
        TestWrapperComponent
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: settingsServiceSpy
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
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
