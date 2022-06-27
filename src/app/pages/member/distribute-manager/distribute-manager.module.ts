import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule} from '@ionic/angular';
import { DistributeManagerPage } from './distribute-manager.page';
import { RouterModule, Routes } from '@angular/router';

const routes:Routes=[
  {
    path:"",
    component:DistributeManagerPage
  }
]

@NgModule({
  declarations: [DistributeManagerPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class DistributeManagerPageModule { }
