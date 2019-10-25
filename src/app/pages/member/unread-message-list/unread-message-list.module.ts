import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { UnreadMessageListPage } from './unread-message-list.page';

const routes: Routes = [
  {
    path: '',
    component: UnreadMessageListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [UnreadMessageListPage]
})
export class UnreadMessageListPageModule {}
