import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandsService } from '../../services/commands.service';

import { CommandFooterComponent } from './command-footer.component';

describe('CommandFooterComponent', () => {
  let component: CommandFooterComponent;
  let fixture: ComponentFixture<CommandFooterComponent>;

  beforeEach(async () => {
    const commandSpy = jasmine.createSpyObj('CommandsService', ['submitMarket', 'submitLimit']);
    const syncSpy = jasmine.createSpyObj('SyncService', ['closeCommandModal']);
    await TestBed.configureTestingModule({
      declarations: [ CommandFooterComponent ],
      providers: [
        { provide: CommandsService, useValue: commandSpy },
        { provide: SyncService, useValue: syncSpy },
      ]
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
