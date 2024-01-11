import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProblemWeappTestComponent } from './problem-weapp-test.component';

const routes: Routes = [
    {
        path: '',
        component: ProblemWeappTestComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProblemWeappTestRoutingModule { }
