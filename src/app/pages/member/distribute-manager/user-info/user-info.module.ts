import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserInfoPage } from './user-info.page';
import { Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  {
      path: '',
      component: UserInfoPage
  }
];


@NgModule({
  declarations: [UserInfoPage],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class UserInfoPageModule { }
