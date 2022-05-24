import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalSettingsService } from '../../services/terminal-settings.service';

import { TerminalSettingsComponent } from './terminal-settings.component';

describe('TerminalSettingsComponent', () => {
  let component: TerminalSettingsComponent;
  let fixture: ComponentFixture<TerminalSettingsComponent>;

  const tsSpy = jasmine.createSpyObj('TerminalSettingsService', ['getFullName']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TerminalSettingsComponent],
      providers: [
        { provide: TerminalSettingsService, useValue: tsSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
