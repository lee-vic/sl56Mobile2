import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthInfoRoutingModule } from './auth-info-routing.module';
import { AuthInfoPage } from './auth-info.page';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [AuthInfoPage],
  imports: [
    CommonModule,
    AuthInfoRoutingModule,
    IonicModule
  ]
})
export class AuthInfoPageModule { }
