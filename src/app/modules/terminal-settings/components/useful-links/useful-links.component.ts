import { Component } from '@angular/core';
import { EnvironmentService } from 'src/app/shared/services/environment.service';

@Component({
    selector: 'ats-useful-links',
    templateUrl: './useful-links.component.html',
    styleUrls: ['./useful-links.component.less'],
    standalone: false
})
export class UsefulLinksComponent {
  readonly externalLinks = this.environmentService.externalLinks;
  constructor(private readonly environmentService: EnvironmentService) {
  }

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}
