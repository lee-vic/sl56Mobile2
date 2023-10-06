import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { InterviewPage } from './interview.page';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
const routes: Routes = [
  {
    path: "",
    component: InterviewPage,
  },
];
@NgModule({
  declarations: [InterviewPage],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule,
    FormsModule
  ],
})
export class InterviewModule {}
