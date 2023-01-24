import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetSkeletonComponent } from './widget-skeleton.component';

describe('WidgetSkeletonComponent', () => {
  let component: WidgetSkeletonComponent;
  let fixture: ComponentFixture<WidgetSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WidgetSkeletonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WidgetSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
