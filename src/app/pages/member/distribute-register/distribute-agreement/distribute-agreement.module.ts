import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule} from '@ionic/angular';
import { DistributeAgreementPage } from './distribute-agreement.page';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
      path: '',
      component: DistributeAgreementPage
  }
];
@NgModule({
  declarations: [DistributeAgreementPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class DistributeAgreementModule { }
