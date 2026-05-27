import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { ProductPage } from './product.page';

describe('ProductPage', () => {
  let component: ProductPage;
  let fixture: ComponentFixture<ProductPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '4' }) } },
        },
      ],
      declarations: [ ProductPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize tab from route param', () => {
    expect(component.tab).toBe('4');
  });

  it('should ignore invalid carrier selection', () => {
    component.currentProduct = 2;

    component.selectExpress(0);
    component.selectExpress(5);

    expect(component.currentProduct).toBe(2);
  });

  it('should map goto helpers to correct carrier', () => {
    component.gotoDHL();
    expect(component.currentProduct).toBe(1);

    component.gotoFedEx();
    expect(component.currentProduct).toBe(2);

    component.gotoUPS();
    expect(component.currentProduct).toBe(3);

    component.gotoTNT();
    expect(component.currentProduct).toBe(4);
  });
});
