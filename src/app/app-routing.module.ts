import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
 {
   path:'',
   redirectTo:'/app/tabs/home',
   pathMatch:'full'
  },
  {
    path:"app",
    loadChildren:()=>import('./pages/tabs/tabs/tabs.module').then(m=>m.TabsPageModule)
  },
  {
    path:"member",
    loadChildren:()=>import('./pages/member/member.module').then(m=>m.MemberModule)
  },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'epidemic', loadChildren: './pages/epidemic/epidemic.module#EpidemicPageModule' },
  { path: 'distribute-register', loadChildren:()=>import('./pages/member/distribute-register/distribute-register.module').then(m=>m.DistributeRegisterPageModule) },
  { path: 'distribute-agreement', loadChildren:()=>import('./pages/member/distribute-register/distribute-agreement/distribute-agreement.module').then(m=>m.DistributeAgreementModule) },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules,enableTracing:false  })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
