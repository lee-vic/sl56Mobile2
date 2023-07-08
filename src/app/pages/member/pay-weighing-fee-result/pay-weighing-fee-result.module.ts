import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayWeighingFeeResultPage } from './pay-weighing-fee-result.page';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
const routes: Routes = [
  {
    path: "",
    component: PayWeighingFeeResultPage,
  },
];
@NgModule({
  declarations: [PayWeighingFeeResultPage],
  imports: [CommonModule, RouterModule.forChild(routes),IonicModule],
  exports: [RouterModule],
})
export class PayWeighingFeeResultModule {}
