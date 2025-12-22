import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from "@angular/core";

import { WidgetSkeletonComponent } from './widget-skeleton.component';

@Component({
  template: `<ng-template #mockTemplate></ng-template>`,
  standalone: true
})
class TestTemplateHolderComponent {
  @ViewChild('mockTemplate', {static: true}) mockTemplate!: TemplateRef<any>;
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
    const mockTemplate = templateHolderFixture.componentInstance.mockTemplate;

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
