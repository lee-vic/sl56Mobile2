export interface CompanyNameListItem {
  ObjectId: number;
  CompanyName: string;
  ChineseCompanyName: string;
  FilingStatus: number | null;
  FilingStatusString: string;
  Remark: string;
  CreateAt: string | null;
  CanEdit: boolean;
}

export interface CompanyNameDetail extends CompanyNameListItem {
  NameType: number;
  NameTypeString: string;
  PersonName: string;
  Phone: string;
  Address1: string;
  Address2: string;
  Address3: string;
  SocialCreditCode: string;
  ImageUrl: string;
}

export interface CompanyNameQueryRequest {
  CompanyName: string;
}

export interface CompanyNameQueryResult {
  Success: boolean;
  Message: string;
  CompanyName: string;
  IsBlacklist: boolean;
  IsFiling: boolean;
}

export interface CompanyNameSaveRequest {
  ObjectId?: number;
  CompanyName: string;
  ChineseCompanyName: string;
  PersonName: string;
  Phone: string;
  Address1: string;
  Address2?: string;
  Address3?: string;
  NameType: number;
  SocialCreditCode: string;
}

export interface CompanyNameActionResult {
  Success: boolean;
  Message: string;
  ObjectId: number;
  Errors: string[];
}
