import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ImportManifestFormPage } from './import-manifest-form.page';

const routes: Routes = [
  {
    path: '',
    component: ImportManifestFormPage,
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
  declarations: [ImportManifestFormPage],
})
export class ImportManifestFormPageModule {}
