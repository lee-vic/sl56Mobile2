import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthInfoPage } from './auth-info.page';

const routes: Routes = [
    {
        path: '',
        component: AuthInfoPage
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthInfoRoutingModule { }
