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
  { path: 'wechat-pay-list', loadChildren:()=>import('./wechat-pay-list/wechat-pay-list.module').then(m=>m.WechatPayListPageModule) },
  { path: 'remote', loadChildren:()=>import('./remote/remote.module').then(m=>m.RemotePageModule) },
  { path: 'wechat-pay-description', loadChildren:()=>import('./wechat-pay-description/wechat-pay-description.module').then(m=>m.WechatPayDescriptionPageModule) },
  { path: 'chat/:id', loadChildren:()=>import('./chat/chat.module').then(p=>p.ChatPageModule) },
  { path: 'unread-message-list', loadChildren:()=>import("./unread-message-list/unread-message-list.module").then(m=>m.UnreadMessageListPageModule) },
  { path: 'wechat-binding', loadChildren:()=>import('.//wechat-binding/wechat-binding.module').then(p=>p.WechatBindingPageModule) },
  { path: 'return-list', loadChildren: ()=> import('./return-list/return-list.module').then(m=>m.ReturnListPageModule) },
  { path: 'return-apply/:id', loadChildren:()=>import('./return-apply/return-apply.module').then(m=>m.ReturnApplyPageModule) },
  { path: 'problem-list', loadChildren:()=>import('./problem-list/problem-list.module').then(m=>m.ProblemListPageModule) },
  { path: 'problem-detail/:id', loadChildren:()=>import('./problem-detail/problem-detail.module').then(m=>m.ProblemDetailPageModule)},
  { path: 'reset-password', loadChildren:()=>import('./reset-password/reset-password.module').then(m=>m.ResetPasswordPageModule) },
  { path: 'template-list', loadChildren:()=>import('./template-list/template-list.module').then(m=>m.TemplateListPageModule)}
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberRoutingModule { }
