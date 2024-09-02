import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignTheContractRoutingModule } from './sign-the-contract-routing.module';
import { SignTheContractComponent } from './sign-the-contract.page';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [SignTheContractComponent],
  imports: [
    CommonModule,
    SignTheContractRoutingModule,
    IonicModule
  ]
})
export class SignTheContractPageModule { }
