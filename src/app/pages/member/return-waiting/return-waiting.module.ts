import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReturnWaitingPage } from './return-waiting.page';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule }   from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: ReturnWaitingPage
  }
];

@NgModule({
  declarations: [ReturnWaitingPage],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ReturnWaitingModule { }
