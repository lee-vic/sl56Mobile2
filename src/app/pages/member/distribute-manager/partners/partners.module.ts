import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule} from '@ionic/angular';
import { PartnersPage } from './partners.page';
import { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';


const routes: Routes = [
  {
      path: '',
      component: PartnersPage
  }
];
@NgModule({
  declarations: [PartnersPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class PartnersPageModule { }
