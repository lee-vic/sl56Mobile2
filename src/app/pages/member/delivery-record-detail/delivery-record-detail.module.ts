import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DeliveryRecordDetailPage } from './delivery-record-detail.page';

const routes: Routes = [
  {
    path: '',
    component: DeliveryRecordDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DeliveryRecordDetailPage]
})
export class DeliveryRecordDetailPageModule {}
