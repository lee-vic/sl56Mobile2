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
  },{ 
    path: 'message-subscription',
    children:[{
      path:"list",
      loadChildren:()=>import('./message-subscription/message-subscription.module').then(m=>m.MessageSubscriptionModule)
    },{
      path:"member/:type",
      loadChildren:()=>import('./message-subscription-member/message-subscription-member.module').then(m=>m.MessageSubscriptionMemberModule)
    },{
      path:"edit/:type",
      loadChildren:()=>import('./message-subscription-edit/message-subscription-edit.module').then(m=>m.MessageSubscriptionEditModule)
    }]
  },
  { path: 'confirmation', loadChildren:()=>import("./confirmation/confirmation.module").then(m=>m.ConfirmationPageModule)},
  { path: 'wechat-pay/:id',  loadChildren:()=> import('./wechat-pay/wechat-pay.module').then(m=>m.WechatPayPageModule) },
  { path: 'wechat-pay-list', loadChildren:()=>import('./wechat-pay-list/wechat-pay-list.module').then(m=>m.WechatPayListPageModule) },
  { path: 'remote', loadChildren:()=>import('./remote/remote.module').then(m=>m.RemotePageModule) },
  { path: 'wechat-pay-description', loadChildren:()=>import('./wechat-pay-description/wechat-pay-description.module').then(m=>m.WechatPayDescriptionPageModule) },
  { path: 'chat/:id', loadChildren:()=>import('./chat/chat.module').then(p=>p.ChatPageModule) },
  { path: 'unread-message-list', loadChildren:()=>import("./unread-message-list/unread-message-list.module").then(m=>m.UnreadMessageListPageModule) },
  { path: 'wechat-binding', loadChildren:()=>import('.//wechat-binding/wechat-binding.module').then(p=>p.WechatBindingPageModule) },
  { path: 'return-list', loadChildren: ()=> import('./return-list/return-list.module').then(m=>m.ReturnListPageModule) },
  { path: 'return-apply', loadChildren:()=>import('./return-apply/return-apply.module').then(m=>m.ReturnApplyPageModule) },
  { path: 'problem-list', loadChildren:()=>import('./problem-list/problem-list.module').then(m=>m.ProblemListPageModule) },
  { path: 'problem-detail/:id', loadChildren:()=>import('./problem-detail/problem-detail.module').then(m=>m.ProblemDetailPageModule)},
  { path: 'reset-password', loadChildren:()=>import('./reset-password/reset-password.module').then(m=>m.ResetPasswordPageModule) },
  { path: 'template-list', loadChildren:()=>import('./template-list/template-list.module').then(m=>m.TemplateListPageModule)},
  { path: 'price-list', loadChildren: ()=>import('./price-list/price-list.module').then(m=>m.PriceListPageModule) },
  { path: 'modify-password', loadChildren:()=>import('./modify-password/modify-password.module').then(m=>m.ModifyPasswordPageModule) },
  { path: 'sub-account', loadChildren: ()=>import('./sub-account/sub-account.module').then(m=>m.SubAccountPageModule)},
  { path: 'sub-account-detail/:id', loadChildren:()=>import('./sub-account-detail/sub-account-detail.module').then(p=>p.SubAccountDetailPageModule) },
  { path: 'notice-list', loadChildren:()=>import('./notice-list/notice-list.module').then(m=>m.NoticeListPageModule)},
  { path: 'notice-detail/:id', loadChildren: ()=>import('./notice-detail/notice-detail.module').then(m=>m.NoticeDetailPageModule) },
  { path: 'bank-slips', loadChildren: ()=>import('./bank-slips/bank-slips.module').then(m=>m.BankSlipsPageModule) },
  { path: 'unread-message-list1',loadChildren:()=>import('./unread-message-list1/unread-message-list1.module').then(m=>m.UnreadMessageList1PageModule)},
  { path: 'return-waiting',loadChildren:()=>import('./return-waiting/return-waiting.module').then(m=>m.ReturnWaitingModule),runGuardsAndResolvers:"always"}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberRoutingModule { }
