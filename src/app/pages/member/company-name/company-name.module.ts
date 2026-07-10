import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CompanyNamePage } from './company-name.page';
import { CompanyNameFormPage } from './company-name-form.page';
import { CompanyNameDetailPage } from './company-name-detail.page';

const routes: Routes = [
  {
    path: '',
    component: CompanyNamePage,
  },
  {
    path: 'form',
    component: CompanyNameFormPage,
  },
  {
    path: 'form/:id',
    component: CompanyNameFormPage,
  },
  {
    path: 'detail/:id',
    component: CompanyNameDetailPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CompanyNamePage, CompanyNameFormPage, CompanyNameDetailPage],
})
export class CompanyNamePageModule {}
