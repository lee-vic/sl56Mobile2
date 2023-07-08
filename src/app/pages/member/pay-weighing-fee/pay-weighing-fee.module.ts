import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from "@ionic/angular";
import { PayWeighingFeePage } from "./pay-weighing-fee.page";
import { RouterModule, Routes } from '@angular/router';
import { CookieService } from "ngx-cookie-service";
const routes: Routes = [
  {
    path: "",
    component: PayWeighingFeePage,
  },
];
@NgModule({
  declarations: [PayWeighingFeePage],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule
  ],
  exports:[RouterModule],
  providers:[CookieService]
})
export class PayWeighingFeeModule {}
