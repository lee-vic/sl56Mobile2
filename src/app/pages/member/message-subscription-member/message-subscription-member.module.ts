import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Routes,RouterModule} from '@angular/router';
import { MessageSubscriptionMemberPage } from './message-subscription-member.page';
import { IonicModule } from '@ionic/angular';

const routes:Routes=[
  {
    path:"",
    component:MessageSubscriptionMemberPage
  }
];

@NgModule({
  declarations: [MessageSubscriptionMemberPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class MessageSubscriptionMemberModule { }
