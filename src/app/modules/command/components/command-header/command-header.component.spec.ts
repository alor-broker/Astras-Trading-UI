import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuotesService } from 'src/app/shared/services/quotes.service';

import { CommandHeaderComponent } from './command-header.component';

describe('CommandHeaderComponent', () => {
  let component: CommandHeaderComponent;
  let fixture: ComponentFixture<CommandHeaderComponent>;
  const spy = jasmine.createSpyObj('QuotesService', ['getQuotes']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommandHeaderComponent ],
      providers: [
        { provide: QuotesService, useValue: spy }
      ]
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
