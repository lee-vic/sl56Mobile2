import { Component } from '@angular/core';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

interface BankAccount {
  bankName: string;
  accountName: string;
  branchName: string;
  accountNo: string;
}

@Component({
  selector: 'app-bank',
  templateUrl: './bank.page.html',
  styleUrls: ['./bank.page.scss'],
})
export class BankPage {
  accounts: BankAccount[] = [
    {
      bankName: '中国银行',
      accountName: '深圳市升蓝物流有限公司',
      branchName: '中国银行股份有限公司深圳机场支行',
      accountNo: '764057955149'
    },
    {
      bankName: '招商银行',
      accountName: '深圳市升蓝物流有限公司',
      branchName: '招商银行股份有限公司深圳深南中路支行',
      accountNo: '755919924510101'
    }
  ];

  constructor(private readonly uiFeedbackService: UiFeedbackService) { }

  trackByAccountNo(_index: number, item: BankAccount): string {
    return item.accountNo;
  }

  async copyAccountNo(account: BankAccount): Promise<void> {
    try {
      await this.copyText(account.accountNo);
      await this.uiFeedbackService.presentToast('银行账号已复制', 1600, 'middle', undefined, 'success');
    } catch {
      await this.uiFeedbackService.presentToast('复制失败，请长按账号手动复制', 2200, 'middle', undefined, 'danger');
    }
  }

  private async copyText(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(input);

    if (!copied) {
      throw new Error('Copy command failed');
    }
  }

}
