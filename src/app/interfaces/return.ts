export interface ReturnCompletedItem {
  Id: number;
  ReferenceNumber: string;
  TrackNumber?: string;
  PriceName?: string;
  PriceCode?: string;
  Weight?: string;
  Amount?: string;
  Date?: string;
  Selected?: boolean;
  ModeOfTransportName?: string;
  ProductContent?: string;
  ChargeableWeight?: string;
  Piece?: number;
  CountryName?: string;
  CountryNameCN?: string;
  Currency?: string;
  IsReturn?: boolean;
  Remark?: string;
}

export interface ReturnWaitingItem {
  Id: number;
  ReferenceNumber: string;
  TrackNumber?: string;
  PriceName?: string;
  Weight?: string;
  Amount?: string;
  Date?: string;
  Selected: boolean;
}

export interface ReturnApplyModel {
  PersonName?: string;
  IdList?: string;
  AllowApply?: boolean;
  ErrorMessage?: string;
  Message?: string;
  WarningMessage?: string;
  Remark?: string;
  RequiredDate?: string;
  WorkflowReturnGoodsId?: number;
  CreateAt?: string;
  ReferenceNumber?: string;
  ObjectId?: number;
  ApplyType?: number;
  IsSuccess?: boolean;
  MobilePhone?: string;
  PickupCode?: string;
  ExpiredTime?: string;
}

export interface ReturnInProgressItem extends ReturnApplyModel {
  ObjectId: number;
  ReferenceNumber: string;
  displayReferenceNumber?: string;
  referenceNumbers?: string[];
}

export interface ReturnActionResult {
  Success?: boolean;
  IsSuccess?: boolean;
  Result?: boolean;
  ErrMsg?: string;
  ErrorMessage?: string;
  Message?: string;
}

export type ReturnMobileUpdateResponse = ReturnActionResult | string | null | undefined;

export interface ReturnHistoryContact {
  raw: string;
  personName: string;
  mobilePhone: string;
}
