import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes,RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ModifyDeliverypasswordPage } from './modify-deliverypassword.page';
const routes: Routes = [
  {
    path: '',
    component: ModifyDeliverypasswordPage
  }
];
@NgModule({
  declarations: [ModifyDeliverypasswordPage],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class ModifyDeliverypasswordPageModule { }
