import { Component, OnInit } from '@angular/core';

import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CalculationStateService } from 'src/app/providers/calculation-state.service';

type CalculationResultItem = {
  PriceIEType?: number;
  PriceType?: string;
  PriceCode?: string;
  Series?: string;
  PriceName?: string;
  ImportantTip?: string;
  TotalAmount?: number | string;
  [key: string]: unknown;
};

type CalculationResultTab = {
  PriceType: string;
  PriceList: CalculationResultItem[];
};

@Component({
  selector: 'app-calculation-list',
  templateUrl: './calculation-list.page.html',
  styleUrls: ['./calculation-list.page.scss'],
})
export class CalculationListPageComponent implements OnInit {
  calculateResultList: CalculationResultItem[] = [];
  tabsData: CalculationResultTab[] = [];
  currentTabIndex = 0;
  selectingForecast = false;
  private expandedTipKeys = new Set<string>();
  private highRiskTipKeywords = ['税', '关税', '收费', '仅', '限制', '失败', '拒收', '不支持'];
  constructor(private nav: NavController, private router: Router, private calculationState: CalculationStateService) { }

  ngOnInit() {
    this.calculateResultList = this.calculationState.getCalculationResults() as CalculationResultItem[] | null || [];

    if (!this.calculateResultList || this.calculateResultList.length === 0) {
      const fallback = localStorage.getItem('CalculationResult');
      this.calculateResultList = fallback ? JSON.parse(fallback) as CalculationResultItem[] : [];
    }

    if (!Array.isArray(this.calculateResultList) || this.calculateResultList.length === 0) {
      this.tabsData = [];
      this.currentTabIndex = 0;
      return;
    }

    const tempData: CalculationResultTab[] = [];

    this.calculateResultList.forEach((element) => {
      const priceType = element.PriceType || '结果';
      let targetTab = tempData.find((item) => item.PriceType === priceType);

      if (!targetTab) {
        targetTab = {
          PriceType: priceType,
          PriceList: [],
        };

        if (priceType === '出口价') {
          tempData.unshift(targetTab);
        } else {
          tempData.push(targetTab);
        }
      }

      targetTab.PriceList.push(element);
    });

    this.tabsData = tempData;
  }

  get currentPriceList() {
    if (!Array.isArray(this.tabsData) || this.tabsData.length === 0) {
      return [];
    }
    return this.tabsData[this.currentTabIndex]?.PriceList || [];
  }

  get hasForecastQuotes() {
    return this.currentPriceList.some(item => this.canForecast(item));
  }

  canForecast(item: CalculationResultItem) {
    return !!this.calculationState.forecastParameters?.country && !!item.PriceCode && item.PriceIEType !== 1;
  }

  ionViewWillLeave() {
    // Ionic 会缓存列表页，返回时恢复点击报价查看详情的行为。
    this.selectingForecast = false;
  }

  getTabLabel(tab: CalculationResultTab) {
    const count = Array.isArray(tab?.PriceList) ? tab.PriceList.length : 0;
    return `${tab?.PriceType || '结果'} (${count})`;
  }

  getTipColor(tip: string) {
    if (!tip) {
      return 'medium';
    }
    const hasHighRisk = this.highRiskTipKeywords.some((keyword) => tip.includes(keyword));
    return hasHighRisk ? 'danger' : 'medium';
  }

  isHighRiskTip(tip: string) {
    return this.getTipColor(tip) === 'danger';
  }

  isTipLong(tip: string) {
    return (tip || '').trim().length > 48;
  }

  isTipExpanded(item: CalculationResultItem) {
    return this.expandedTipKeys.has(this.getTipKey(item));
  }

  toggleTip(item: CalculationResultItem, event: Event) {
    event.stopPropagation();
    const key = this.getTipKey(item);
    if (this.expandedTipKeys.has(key)) {
      this.expandedTipKeys.delete(key);
    } else {
      this.expandedTipKeys.add(key);
    }
  }

  private getTipKey(item: CalculationResultItem) {
    return `${item?.PriceCode || ''}|${item?.Series || ''}|${item?.TotalAmount || ''}`;
  }

  isRecommended(index: number) {
    return index === 0;
  }

  onTabChange() {
    this.expandedTipKeys.clear();
  }

  openQuote(item: CalculationResultItem) {
    if (this.selectingForecast) {
      if (this.canForecast(item)) {
        this.router.navigate(['/member/import-manifest/form'], {
          queryParams: { ...this.calculationState.forecastParameters, price: item.PriceCode }
        });
      }
      return;
    }

    this.calculationState.setCurrentDetail(item);
    localStorage.setItem("CalculationDetail",JSON.stringify(item));
    this.router.navigateByUrl("/member/calculation/calculation-detail");
  }

  recalculate() {
    this.nav.navigateBack("/member/calculation");
  }
}
