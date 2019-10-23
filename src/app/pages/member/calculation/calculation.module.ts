import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CalculationPage } from './calculation.page';

const routes: Routes = [
  {
    path: '',
    component: CalculationPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,

    RouterModule.forChild(routes)
  ],
  declarations: [CalculationPage]
})
export class CalculationPageModule {}
