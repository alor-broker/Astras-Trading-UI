import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { LimitCommand } from '../../models/limit-command.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.sass']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  isVisible$: Observable<boolean> = of(false);
  commandParams = new BehaviorSubject<LimitCommand | null>(null)
  initialParams: CommandParams | null = null
  initialParamsSub: Subscription
  form!: FormGroup;

  constructor(private sync: SyncService, private service: CommandsService) {
    this.isVisible$ = this.sync.shouldShowCommandModal$;
    this.initialParamsSub = this.sync.commandParams$.subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        this.commandParams.next({
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          side: this.initialParams.side,
          type: CommandType.Limit,
          quantity: 0,
          price: 0
        })
      }
    })
   }

   ngOnInit() {
    this.commandParams.subscribe(params => {
       if (params) {
         this.form = new FormGroup({
           portfolio: new FormControl(params.user.portfolio, [
             Validators.required,
             Validators.minLength(4)
           ]),
           exchange: new FormControl(params.user.exchange, Validators.required),
         });
       }
     })
   }

   submitForm(): void {
     const command = this.commandParams.getValue();
     if (command) {
      this.service.submitLimit(command).subscribe();
      console.log('submit', this.form.value);
     }
     else console.error('Empty command')
   }

  ngOnDestroy(): void {
    this.initialParamsSub.unsubscribe();
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
