import { Component } from '@angular/core';
import { EnvironmentService } from 'src/app/shared/services/environment.service';

@Component({
  selector: 'ats-useful-links',
  templateUrl: './useful-links.component.html',
  styleUrls: ['./useful-links.component.less']
})
export class UsefulLinksComponent {
  readonly externalLinks = this.environmentService.externalLinks;
  constructor(private readonly environmentService: EnvironmentService) {
  }
}
