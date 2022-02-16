import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminalSettingsWidgetComponent } from './terminal-settings-widget.component';

describe('TerminalSettingsWidgetComponent', () => {
  let component: TerminalSettingsWidgetComponent;
  let fixture: ComponentFixture<TerminalSettingsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TerminalSettingsWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalSettingsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
