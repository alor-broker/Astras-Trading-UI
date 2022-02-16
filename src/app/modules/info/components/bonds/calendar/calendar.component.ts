import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Calendar } from '../../../models/calendar.model';
import { InfoService } from '../../../services/info.service';

@Component({
  selector: 'ats-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.less']
})
export class CalendarComponent implements OnInit {
  @Input()
  guid!: string

  calendar$?: Observable<Calendar>;

  constructor(private service: InfoService) { }

  ngOnInit(): void {
    this.calendar$ = this.service.getCalendar();
  }

}
