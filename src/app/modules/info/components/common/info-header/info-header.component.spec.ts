import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoHeaderComponent } from './info-header.component';

describe('InfoHeaderComponent', () => {
  let component: InfoHeaderComponent;
  let fixture: ComponentFixture<InfoHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
