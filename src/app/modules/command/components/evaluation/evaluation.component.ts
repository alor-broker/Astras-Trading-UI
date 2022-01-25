import { Component, Input, OnInit } from '@angular/core';
import { MathHelper } from 'src/app/shared/utils/math-helper';

@Component({
  selector: 'ats-evaluation[price][quantity]',
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.sass']
})
export class EvaluationComponent implements OnInit {
  @Input()
  price = 0
  @Input()
  quantity = 0

  constructor() { }

  ngOnInit(): void {
  }

  // ToDo: API Call
  getVolume() {
    return MathHelper.round(this.price * 10 * this.quantity, 2)
  }

  // ToDo: API Call
  getComission() {
    return MathHelper.round(this.price * 10 * this.quantity * 0.005, 2)
  }
}
