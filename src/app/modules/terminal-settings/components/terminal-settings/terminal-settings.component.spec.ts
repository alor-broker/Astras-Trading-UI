import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TerminalSettingsComponent} from './terminal-settings.component';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {ReactiveFormsModule, FormBuilder} from "@angular/forms";
import {AccountService} from "../../../../shared/services/account.service";
import {EMPTY, of} from "rxjs";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

describe('TerminalSettingsComponent', () => {
  let component: TerminalSettingsComponent;
  let fixture: ComponentFixture<TerminalSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    MockInstance(AccountService, 'getFullName', () => of({
      firstName: 'first',
      lastName: 'last',
      secondName: 'second'
    }));
    MockInstance(TerminalSettingsService, 'getSettings', () => EMPTY);

    return MockBuilder(TerminalSettingsComponent)
      .keep(ReactiveFormsModule)
      .keep(FormBuilder);
  });

  beforeEach(() => {
    fixture = MockRender(TerminalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
