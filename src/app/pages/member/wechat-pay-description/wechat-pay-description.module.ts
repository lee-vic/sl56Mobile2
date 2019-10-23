import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WechatPayDescriptionPage } from './wechat-pay-description.page';

const routes: Routes = [
  {
    path: '',
    component: WechatPayDescriptionPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WechatPayDescriptionPage]
})
export class WechatPayDescriptionPageModule {}
