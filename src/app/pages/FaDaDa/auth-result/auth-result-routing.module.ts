import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthResultPage } from './auth-result.page';

const routes: Routes = [
    {
        path: '',
        component: AuthResultPage
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthResultRoutingModule { }
