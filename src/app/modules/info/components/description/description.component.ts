import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Description } from '../../models/description.model';
import { InfoService } from '../../services/info.service';

@Component({
  selector: 'ats-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.less']
})
export class DescriptionComponent implements OnInit {
  @Input()
  guid!: string
  columns: number = 1;
  description$?: Observable<Description>

  constructor(private service: InfoService) { }

  ngOnInit(): void {
    this.description$ = this.service.getDescription();
  }

}
