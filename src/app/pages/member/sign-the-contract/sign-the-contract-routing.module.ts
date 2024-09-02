import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SignTheContractComponent } from './sign-the-contract.page';

const routes: Routes = [
    {
        path: '',
        component: SignTheContractComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SignTheContractRoutingModule { }
