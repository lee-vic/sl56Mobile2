import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthResultRoutingModule } from './auth-result-routing.module';
import { AuthResultPage } from './auth-result.page';

@NgModule({
  declarations: [AuthResultPage],
  imports: [
    CommonModule,
    AuthResultRoutingModule
  ]
})
export class AuthResultPageModule { }
