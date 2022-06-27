import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharePage } from './share.page';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';

const routes: Routes = [
  {
      path: '',
      component: SharePage
  }
];
@NgModule({
  declarations: [SharePage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class SharePageModule { }
