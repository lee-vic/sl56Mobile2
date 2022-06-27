import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DistributeRegisterPage } from './distribute-register.page';
import { IonicModule} from '@ionic/angular';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


const routes: Routes = [
  {
    path: '',
    component: DistributeRegisterPage
  }
];
@NgModule({
  declarations: [DistributeRegisterPage],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class DistributeRegisterPageModule { }
