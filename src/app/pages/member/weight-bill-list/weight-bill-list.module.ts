import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WeightBillListPage } from './weight-bill-list.page';
import { CookieService } from 'ngx-cookie-service';

const routes: Routes = [
  {
    path: '',
    component: WeightBillListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WeightBillListPage],
  providers:[CookieService]
})
export class WeightBillListPageModule {}
