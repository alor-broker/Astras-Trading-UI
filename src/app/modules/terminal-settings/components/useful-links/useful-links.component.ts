import { Component } from '@angular/core';
import {environment} from "../../../../../environments/environment";

@Component({
  selector: 'ats-useful-links',
  templateUrl: './useful-links.component.html',
  styleUrls: ['./useful-links.component.less']
})
export class UsefulLinksComponent {
  readonly externalLinks = environment.externalLinks;
}
