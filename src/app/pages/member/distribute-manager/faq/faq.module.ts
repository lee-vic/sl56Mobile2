import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FaqPage } from './faq.page';
import { Routes,RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

const routes:Routes=[{
  path:"",
  component:FaqPage
}];

@NgModule({
  declarations: [FaqPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class FaqPageModule { }
