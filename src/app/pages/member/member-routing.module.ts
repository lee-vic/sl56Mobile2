import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [ {
    path: 'calculation', children: [{
      path: "",
      loadChildren: () => import('./calculation/calculation.module').then(m => m.CalculationPageModule)
    }, {
      path: "calculation-list",
      loadChildren: () => import('./calculation-list/calculation-list.module').then(m => m.CalculationListPageModule)
    }, {
      path: 'calculation-detail',
      loadChildren: () => import('./calculation-detail/calculation-detail.module').then(m => m.CalculationDetailPageModule)
    }]
    
  }, {
    path: "delivery-record",
    children: [{
      path: "list",
      loadChildren: () => import('./delivery-record/delivery-record.module').then(m => m.DeliveryRecordPageModule)
    },{
      path:"detail/:id",
      loadChildren:()=> import('./delivery-record-detail/delivery-record-detail.module').then(m=>m.DeliveryRecordDetailPageModule)
    } ]
  },
  { path: 'confirmation', loadChildren:()=>import("./confirmation/confirmation.module").then(m=>m.ConfirmationPageModule)},
  { path: 'wechat-pay',  loadChildren:()=> import('./wechat-pay/wechat-pay.module').then(m=>m.WechatPayPageModule) },
  { path: 'wechat-pay-list', loadChildren: './wechat-pay-list/wechat-pay-list.module#WechatPayListPageModule' },
  { path: 'remote', loadChildren: './remote/remote.module#RemotePageModule' },
  { path: 'wechat-pay-description', loadChildren: './wechat-pay-description/wechat-pay-description.module#WechatPayDescriptionPageModule' },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberRoutingModule { }
