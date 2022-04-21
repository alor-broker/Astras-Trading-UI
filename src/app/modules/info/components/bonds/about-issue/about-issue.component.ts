import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Issue } from '../../../models/issue.model';
import { InfoService } from '../../../services/info.service';

@Component({
  selector: 'ats-about-issue',
  templateUrl: './about-issue.component.html',
  styleUrls: ['./about-issue.component.less']
})
export class AboutIssueComponent implements OnInit {
  @Input()
  guid!: string;

  issue$?: Observable<Issue>;

  columns = 1;

  constructor(private service: InfoService) { }

  ngOnInit(): void {
    this.issue$ = this.service.getIssue();
  }

}
