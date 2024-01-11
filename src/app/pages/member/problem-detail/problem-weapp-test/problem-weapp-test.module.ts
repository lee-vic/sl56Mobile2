import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProblemWeappTestRoutingModule } from './problem-weapp-test-routing.module';
import { ProblemWeappTestComponent } from './problem-weapp-test.component';

@NgModule({
  declarations: [ProblemWeappTestComponent],
  imports: [
    CommonModule,
    ProblemWeappTestRoutingModule
  ]
})
export class ProblemWeappTestModule { }
