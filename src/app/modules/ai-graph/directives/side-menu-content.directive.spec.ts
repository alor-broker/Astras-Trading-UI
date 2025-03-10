import { SideMenuContentDirective } from './side-menu-content.directive';
import {MockService} from "ng-mocks";
import {TemplateRef} from "@angular/core";

describe('SideMenuContentDirective', () => {
  it('should create an instance', () => {
    const directive = new SideMenuContentDirective(MockService(TemplateRef<unknown>));
    expect(directive).toBeTruthy();
  });
});
