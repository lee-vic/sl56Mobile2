import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageSubscriptionPage } from './message-subscription.page';
import {Routes,RouterModule} from '@angular/router';
import {IonicModule} from '@ionic/angular'
const routes:Routes=[
  {
    path:'',
    component:MessageSubscriptionPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [MessageSubscriptionPage]
})
export class MessageSubscriptionModule { }
