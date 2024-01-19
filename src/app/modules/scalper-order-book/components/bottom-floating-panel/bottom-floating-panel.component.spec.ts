import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomFloatingPanelComponent } from './bottom-floating-panel.component';
import { mockComponent } from "../../../../shared/utils/testing";

describe('BottomFloatingPanelComponent', () => {
  let component: BottomFloatingPanelComponent;
  let fixture: ComponentFixture<BottomFloatingPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        BottomFloatingPanelComponent,
        mockComponent({ selector: 'ats-modifiers-indicator'}),
        mockComponent({ selector: 'ats-working-volumes-panel', inputs: ['guid', 'isActive']}),
        mockComponent({ selector: 'ats-short-long-indicator', inputs: ['dataContext']}),
      ]
    });
    fixture = TestBed.createComponent(BottomFloatingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
