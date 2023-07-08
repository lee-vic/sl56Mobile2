import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PayWeighingFeeDetailPage } from './pay-weighing-fee-detail.page';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
const routes: Routes = [
  {
    path: "",
    component: PayWeighingFeeDetailPage,
  },
];
@NgModule({
  declarations: [PayWeighingFeeDetailPage],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule,
    FormsModule,
  ],
  exports: [RouterModule],
})
export class PayWeighingFeeDetailModule {}
