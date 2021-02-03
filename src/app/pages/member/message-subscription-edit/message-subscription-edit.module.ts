import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageSubscriptionEditPage } from './message-subscription-edit.page';
import { Routes,RouterModule} from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

const routes:Routes=[{
  path:"",
  component:MessageSubscriptionEditPage
}]

@NgModule({
  declarations: [MessageSubscriptionEditPage],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class MessageSubscriptionEditModule { }
