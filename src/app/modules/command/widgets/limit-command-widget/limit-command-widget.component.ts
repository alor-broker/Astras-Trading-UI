import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, filter, Observable, of } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { SyncService } from 'src/app/shared/services/sync.service';

@Component({
  selector: 'ats-limit-command-widget',
  templateUrl: './limit-command-widget.component.html',
  styleUrls: ['./limit-command-widget.component.sass']
})
export class LimitCommandWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  commandParams$?: Observable<CommandParams>;

  constructor(private sync: SyncService) { }

  ngOnInit(): void {
    this.commandParams$ = this.sync.commandParams$.pipe(
      filter((p): p is CommandParams => !!p)
    );
    this.isVisible$ = this.sync.shouldShowCommandModal$;
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.sync.closeCommandModal();
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.sync.closeCommandModal();
  }
}
