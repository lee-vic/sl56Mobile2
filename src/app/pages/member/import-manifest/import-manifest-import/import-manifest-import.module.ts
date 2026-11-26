import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ImportManifestImportPage } from './import-manifest-import.page';

const routes: Routes = [
  {
    path: '',
    component: ImportManifestImportPage,
  },
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ImportManifestImportPage],
})
export class ImportManifestImportPageModule {}
