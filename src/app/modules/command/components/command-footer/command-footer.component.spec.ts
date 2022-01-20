import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandFooterComponent } from './command-footer.component';

describe('CommandFooterComponent', () => {
  let component: CommandFooterComponent;
  let fixture: ComponentFixture<CommandFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommandFooterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
