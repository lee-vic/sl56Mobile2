import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WechatBindingPage } from './wechat-binding.page';

const routes: Routes = [
  {
    path: '',
    component: WechatBindingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WechatBindingPage]
})
export class WechatBindingPageModule {}
