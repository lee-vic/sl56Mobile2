import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { UnreadMessageList1Page } from './unread-message-list1.page';

const routes: Routes = [
  {
    path: '',
    component: UnreadMessageList1Page
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [UnreadMessageList1Page]
})
export class UnreadMessageList1PageModule {}
