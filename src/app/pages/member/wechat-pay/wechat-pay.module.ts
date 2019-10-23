import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WechatPayPage } from './wechat-pay.page';
import { CookieService } from 'ngx-cookie-service';

const routes: Routes = [
  {
    path: '',
    component: WechatPayPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WechatPayPage],
  providers:[CookieService]
})
export class WechatPayPageModule {}
