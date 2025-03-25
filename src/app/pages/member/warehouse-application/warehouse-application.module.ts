import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WarehouseApplicationPage } from './warehouse-application.page';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: WarehouseApplicationPage
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [WarehouseApplicationPage]
})
export class WarehouseApplicationPageModule {}
