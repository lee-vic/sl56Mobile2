import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfitPage } from './profit.page';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';

const routes:Routes=[
  {
    path:'',
    component:ProfitPage
}]

@NgModule({
  declarations: [ProfitPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class ProfitPageModule { }
