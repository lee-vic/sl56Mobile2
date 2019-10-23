import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';


const routes: Routes = [
  {
    
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then(mod => mod.HomePageModule)
      },
      {
        path:'product/:id',
        loadChildren: () => import('./product/product.module').then(m => m.ProductPageModule)
      },
      {
        path: 'product',
        redirectTo: 'product/1',
        pathMatch: "full"
      },
      {
        path:'news/:id',
        loadChildren: () => import('./news/news.module').then(m => m.NewsPageModule)
      },
      {
        path: 'news',
        redirectTo: 'news/2',
        pathMatch: "full"
      },
      {
        path: 'news-details/:id',
        loadChildren: () => import('./news-detail/news-detail.module').then(m => m.NewsDetailPageModule)
      },
      {
        path: 'member',
        loadChildren: () => import('./member/member.module').then(m => m.MemberPageModule)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsRoutingModule { }
