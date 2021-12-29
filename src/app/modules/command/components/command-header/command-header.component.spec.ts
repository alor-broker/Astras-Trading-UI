import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandHeaderComponent } from './command-header.component';

describe('CommandHeaderComponent', () => {
  let component: CommandHeaderComponent;
  let fixture: ComponentFixture<CommandHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommandHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
