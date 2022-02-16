/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HelpWidgetComponent } from './help-widget.component';

describe('HelpWidgetComponent', () => {
  let component: HelpWidgetComponent;
  let fixture: ComponentFixture<HelpWidgetComponent>;

  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [ HelpWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
