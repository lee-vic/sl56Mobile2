import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CalculationStateService } from 'src/app/providers/calculation-state.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';


@Component({
  selector: 'app-calculation-detail',
  templateUrl: './calculation-detail.page.html',
  styleUrls: ['./calculation-detail.page.scss'],
})
export class CalculationDetailPage implements OnInit {
  data:any;
  tab="1";
  private highRiskTipKeywords = ['税', '关税', '收费', '仅', '限制', '失败', '拒收', '不支持'];
  constructor(
    private router: Router,
    private calculationState: CalculationStateService,
    private readonly uiFeedback: UiFeedbackService
  ) { }

  ngOnInit() {
    this.data = this.calculationState.getCurrentDetail();

    if (!this.data) {
      const fallback = localStorage.getItem('CalculationDetail');
      this.data = fallback ? JSON.parse(fallback) : { Charges: [] };
    }

    if (!Array.isArray(this.data.Charges)) {
      this.data.Charges = [];
    }
  }

  get summaryCards() {
    return [
      {
        label: '总价',
        value: this.data?.TotalAmount,
        emphasis: this.data?.Currency || 'CNY',
        type: 'price',
      },
      {
        label: '运输方式',
        value: this.data?.ModeOfTransportName || '-',
        emphasis: '线路',
        type: 'text',
      },
      {
        label: '计费重量',
        value: this.data?.ChargeableWeight || '-',
        emphasis: 'KG',
        type: 'metric',
      },
    ];
  }

  get basicInfoRows() {
    return [
      { label: '目的地', value: this.data?.CountryName || '-' },
      { label: '报价代码', value: this.data?.PriceCode || '-' },
      { label: '报价名称', value: this.data?.PriceName || '-' },
      { label: '运输方式', value: this.data?.ModeOfTransportName || '-' },
      { label: '币别', value: this.data?.Currency || '-' },
      { label: '体积除数', value: this.data?.Volumetric || '-' },
      { label: '含油参考价', value: this.data?.UnitPrice || '-' },
    ];
  }

  get hasImportantTip() {
    return !!(this.data?.ImportantTip || '').trim();
  }

  get hasCharges() {
    return Array.isArray(this.data?.Charges) && this.data.Charges.length > 0;
  }

  isHighRiskTip(tip: string) {
    return this.highRiskTipKeywords.some((keyword) => (tip || '').includes(keyword));
  }

  getRemarkContent(type: 'common' | 'remark' | 'country') {
    if (type === 'common') {
      return this.data?.CommonRemark || '';
    }
    if (type === 'remark') {
      return this.data?.Remark || '';
    }
    return this.data?.CountryRemark || '';
  }

  hasRemarkContent(type: 'common' | 'remark' | 'country') {
    return !!this.getRemarkContent(type).trim();
  }

  async copyPriceCode() {
    await this.copyText(this.data?.PriceCode, '报价代码已复制');
  }

  async copyPriceName() {
    await this.copyText(this.data?.PriceName, '报价名称已复制');
  }

  private async copyText(value: string, successMessage: string) {
    const text = (value || '').trim();
    if (!text) {
      await this.presentToast('暂无可复制内容', 'medium');
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      await this.presentToast(successMessage, 'success');
    } catch {
      await this.presentToast('复制失败，请手动长按复制', 'danger');
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'medium') {
    await this.uiFeedback.presentToast(message, 1800, 'middle', undefined, color);
  }

  backToList() {
    this.router.navigateByUrl('/member/calculation/calculation-list');
  }

  recalculate() {
    this.router.navigateByUrl('/member/calculation');
  }
 
}
