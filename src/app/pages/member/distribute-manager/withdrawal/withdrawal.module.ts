import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WithdrawalPage } from './withdrawal.page';
import { Routes,RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

const routes:Routes=[{
  path:'',
  component:WithdrawalPage
}]

@NgModule({
  declarations: [WithdrawalPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class WithdrawalPageModule { }
