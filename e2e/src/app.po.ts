import { browser, by, element, ExpectedConditions as EC, ElementFinder } from 'protractor';

export class AppPage {
  navigateTo(path: string = '/') {
    return browser.get(path);
  }

  async waitForUrlContains(fragment: string, timeout: number = 10000) {
    await browser.wait(async () => {
      const currentUrl = await browser.getCurrentUrl();
      return currentUrl.indexOf(fragment) >= 0;
    }, timeout, 'URL did not contain expected fragment: ' + fragment);
  }

  async waitForVisible(css: string, timeout: number = 10000): Promise<ElementFinder> {
    const target = element(by.css(css));
    await browser.wait(EC.presenceOf(target), timeout, 'Element not present: ' + css);
    await browser.wait(EC.visibilityOf(target), timeout, 'Element not visible: ' + css);
    return target;
  }

  getCurrentUrl() {
    return browser.getCurrentUrl();
  }

  getText(css: string) {
    return element(by.css(css)).getText();
  }

  getAttribute(css: string, name: string) {
    return element(by.css(css)).getAttribute(name);
  }

  count(css: string) {
    return element.all(by.css(css)).count();
  }

  isPresent(css: string) {
    return element(by.css(css)).isPresent();
  }

  /**
   * Fill an Angular reactive form by patching the component FormGroup
   * via Angular Ivy debug APIs (ng.getComponent / ng.applyChanges).
   * This approach works reliably with Ionic Shadow DOM inputs.
   *
   * @param componentSelector  CSS selector for the page component host element
   *                           (e.g. 'app-modify-password')
   * @param formProp           Name of the FormGroup property on the component
   *                           (e.g. 'myForm')
   * @param values             Map of control names to values to patch
   */
  async fillForm(
    componentSelector: string,
    formProp: string,
    values: { [key: string]: string }
  ): Promise<void> {
    await browser.executeScript(
      `var pageEl = document.querySelector(arguments[0]);
       if (!pageEl) return;
       var ng = window.ng;
       if (!ng || !ng.getComponent) return;
       var comp = ng.getComponent(pageEl);
       if (!comp) return;
       var form = comp[arguments[1]];
       if (!form || typeof form.patchValue !== 'function') return;
       form.patchValue(arguments[2]);
       form.markAllAsTouched();
       ng.applyChanges(comp);`,
      componentSelector,
      formProp,
      values
    );
    await browser.sleep(200);
  }

  /** Wait until a CSS element disabled attribute is removed (form control valid). */
  async waitForEnabled(css: string, timeout: number = 8000): Promise<void> {
    const el = element(by.css(css));
    await browser.wait(async () => {
      const disabled = await el.getAttribute('disabled');
      return disabled === null;
    }, timeout, 'Element still disabled: ' + css);
  }
}
