/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HelpComponent } from './help.component';
import { HelpService } from '../../services/help.service';
import { of } from 'rxjs';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;

  const helpSpy = jasmine.createSpyObj('HelpService', ['getHelp']);
  helpSpy.getHelp.and.returnValue(of(null));

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelpComponent ],
      providers: [
        { provide: HelpService, useValue: helpSpy}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
