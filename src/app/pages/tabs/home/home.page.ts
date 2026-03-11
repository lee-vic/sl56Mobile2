import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface HomeSlide {
  image: string;
}

interface HomeNewsItem {
  title: string;
  description: string;
  image: string;
  cateId?: number;
}

interface HomeProduct {
  image: string;
  product: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  slideOpts = {
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    },
    loop: true,
    speed: 400
  };

  news: HomeNewsItem[] = [
    {
      title: "公司通知",
      description: "升蓝重要通知",
      image: "assets/imgs/home-news-1.png",
      cateId: 2
    },
    {
      title: "业务信息",
      description: "升蓝最新信息",
      image: "assets/imgs/home-news-2.png",
      cateId: 3
    },
    {
      title: "关于我们",
      description: "升蓝介绍",
      image: "assets/imgs/home-news-2.png"
    }
  ];
  slides: HomeSlide[] = [
    {
      image: "assets/imgs/home-slidebox-1.jpg"
    },
    {
      image: "assets/imgs/home-slidebox-2.png"
    },
    {
      image: "assets/imgs/home-slidebox-3.png"
    }
  ];
  products: HomeProduct[] = [
    {
      image: "assets/imgs/home-product-1.png",
      product: "1"
    },
    {
      image: "assets/imgs/home-product-2.png",
      product: "2"
    },
    {
      image: "assets/imgs/home-product-3.png",
      product: "3"
    }
  ];

  constructor(private router: Router) {}

  trackBySlideImage(index: number, slide: HomeSlide): string {
    return slide.image;
  }

  openProduct(prod: HomeProduct) {
    this.router.navigate(["/app/tabs/product", prod.product]);
  }

  openNews(item: HomeNewsItem) {
    if (item.cateId == null) {
      return;
    }

    this.router.navigate(["/app/tabs/news", item.cateId]);
  }
}
