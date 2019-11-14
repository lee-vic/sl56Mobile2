import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ReturnApplyPage } from './return-apply.page';
import { ReturnApplyHistoryPageModule } from '../return-apply-history/return-apply-history.module';

const routes: Routes = [
  {
    path: '',
    component: ReturnApplyPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ReturnApplyHistoryPageModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ReturnApplyPage]
})
export class ReturnApplyPageModule {}
