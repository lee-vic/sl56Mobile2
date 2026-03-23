import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicePreviewPage } from './invoice-preview.page';
import { IonicModule} from '@ionic/angular';
import { Routes, RouterModule } from '@angular/router';
import { PdfViewerModule } from 'ng2-pdf-viewer';

const routes: Routes = [
  {
    path: '',
    component: InvoicePreviewPage
  }
];
@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
    PdfViewerModule
  ],
  declarations: [InvoicePreviewPage]
})
export class InvoicePreviewModule { }
