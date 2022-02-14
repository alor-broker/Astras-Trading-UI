import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FallbackDescriptionComponent } from './fallback-description.component';

describe('FallbackDescriptionComponent', () => {
  let component: FallbackDescriptionComponent;
  let fixture: ComponentFixture<FallbackDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FallbackDescriptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FallbackDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
