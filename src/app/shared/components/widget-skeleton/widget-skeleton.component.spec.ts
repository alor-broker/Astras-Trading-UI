import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, viewChild } from "@angular/core";

import { WidgetSkeletonComponent } from './widget-skeleton.component';

@Component({
  template: `<ng-template #mockTemplate />`,
  standalone: true
})
class TestTemplateHolderComponent {
  readonly mockTemplate = viewChild.required<TemplateRef<any>>('mockTemplate');
}

describe('WidgetSkeletonComponent', () => {
  let component: WidgetSkeletonComponent;
  let fixture: ComponentFixture<WidgetSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetSkeletonComponent, TestTemplateHolderComponent]
    })
    .compileComponents();

    const templateHolderFixture = TestBed.createComponent(TestTemplateHolderComponent);
    const mockTemplate = templateHolderFixture.componentInstance.mockTemplate();

    fixture = TestBed.createComponent(WidgetSkeletonComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('header', mockTemplate);
    fixture.componentRef.setInput('content', mockTemplate);
    fixture.componentRef.setInput('isBlockWidget', false);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
