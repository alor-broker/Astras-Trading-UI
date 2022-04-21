/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WidgetHeaderComponent } from './widget-header.component';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { of } from 'rxjs';

describe('WidgetHeaderComponent', () => {
  let component: WidgetHeaderComponent;
  let fixture: ComponentFixture<WidgetHeaderComponent>;
  let spy = jasmine.createSpyObj('DashboardService', ['getSettings']);
  spy.getSettings.and.returnValue(of({}));
  let modalSpy = jasmine.createSpyObj('ModalService' , ['openHelpModal']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetHeaderComponent ],
      providers: [
        { provide: DashboardService, useValue: spy },
        { provide: ModalService, useValue: modalSpy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
