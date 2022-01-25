import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandWidgetComponent } from './command-widget.component';

describe('CommandWidgetComponent', () => {
  let component: CommandWidgetComponent;
  let fixture: ComponentFixture<CommandWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommandWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
