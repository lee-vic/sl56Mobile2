export interface InquirySize {
  Piece: number | null;
  Weight: number | null;
  Length: number | null;
  Width: number | null;
  Height: number | null;
  CargoAttributeNames: string[] | null;
}

export interface InquiryDraft {
  ReviewMessages?: string[];
  ExcludesDutyPrepayment?: boolean;
  CountryName: string | null;
  ActualWeight: number | null;
  ProductContentTypeName: string | null;
  ProductTypeNames: string[] | null;
  ModeOfTransportNames: string[] | null;
  CargoAttributeNames: string[] | null;
  City: string | null;
  PostalCode: string | null;
  DeclaredValue: number | null;
  DeclaredCurrency: string | null;
  Piece: number | null;
  Sizes: InquirySize[];
}

export interface InquiryResult {
  Draft: InquiryDraft;
  ProductId: number;
  Transports: { Id: number; Name: string }[];
}
