import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchlistTableComponent } from './watchlist-table.component';

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WatchlistTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
