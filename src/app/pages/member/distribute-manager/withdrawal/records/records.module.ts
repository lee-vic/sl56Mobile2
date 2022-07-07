import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecordsPage } from './records.page';
import { Routes,RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

const routes:Routes=[{
  path:"",
  component:RecordsPage
}]

@NgModule({
  declarations: [RecordsPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class RecordsPageModule { }
