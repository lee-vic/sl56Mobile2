export interface ImportManifestListItem {
    Id: number;
    ObjectNo: string;
    CountryName: string;
    ModeOfTransportName: string;
    CustomerPriceName: string;
    Piece: number;
    ContentTypeName: string;
    ContentType: number;
    PostalCode: string;
    CustomerExpressNo: string;
    DeclaredValue: string;
    StatusName: string;
    StatusCode: number;
    ForwardingDocumentCount: number;
    IsLabelPrinted: boolean;
    CreateAt: string;
    Selected?: boolean;
}

export interface ImportManifestListResponse {
    TotalRecords: number;
    Rows: ImportManifestListItem[];
    Summary: {
        totalRecords: number;
        pageIndex: number;
        pageSize: number;
        currentPageCount: number;
    };
}

export interface ImportManifestDetail {
    ObjectId: number;
    ObjectNo: string;
    CustomerId: number;
    CountryId: number;
    CountryName: string;
    ModeOfTransportId: number;
    ModeOfTransportName: string;
    CustomerPriceName: string;
    Status: number;
    StatusName: string;
    Piece: number;
    PostalCode: string;
    ContentType: number;
    ContentTypeName: string;
    DeclaredValue: number;
    CustomerExpressNo: string;
    EntryType: number;
    RequiresSeparateCustomsDeclaration: boolean;
    RequiresDutiesAndTaxesPrepayment: boolean;
    RequiresSpecialVatInvoice: boolean;
    WaybillCreationStatus: number;
    TrackNumber: string;
    LabelPath: string;
    IsLabelPrinted: boolean;
    ForwardingDocumentCount: number;
    CreateAt: string;
    LastChanged: any;
}

export interface ImportManifestSaveRequest {
    ObjectId?: number;
    ObjectNo: string;
    CountryId: number;
    CustomerPriceName: string;
    Piece: number;
    ContentType: number;
    PostalCode?: string;
    DeclaredValue?: number;
    CustomerExpressNo?: string;
    RequiresSeparateCustomsDeclaration: boolean;
    RequiresDutiesAndTaxesPrepayment: boolean;
    RequiresSpecialVatInvoice: boolean;
    PendingDocumentsJson?: string | null;
    DeletedDocumentIds?: number[] | null;
    LastChanged?: any;
}

export interface ImportPreviewRow {
    RowIndex: number;
    ObjectNo: string;
    CountryName: string;
    CountryId: number;
    CustomerPriceName: string;
    Piece: number;
    ContentType: number;
    ContentTypeName: string;
    PostalCode: string;
    CustomerExpressNo: string;
    DeclaredValue: number;
    RequiresSeparateCustomsDeclaration: boolean;
    RequiresDutiesAndTaxesPrepayment: boolean;
    RequiresSpecialVatInvoice: boolean;
    Errors: ImportValidationError[];
    HasError: boolean;
}

export interface ImportValidationError {
    Code: string;
    Message: string;
}

export interface ParseImportResponse {
    Success: boolean;
    ErrorType: string;
    Message: string;
    Summary: ParseImportSummary;
    Rows: ImportPreviewRow[];
}

export interface ParseImportSummary {
    TotalRows: number;
    ValidRows: number;
    ErrorRows: number;
}

export interface SaveImportRequest {
    Rows: ImportRowModel[];
}

export interface ImportRowModel {
    ObjectNo: string;
    CountryId: number;
    CustomerPriceName: string;
    Piece: number;
    ContentType: number;
    PostalCode?: string;
    CustomerExpressNo?: string;
    DeclaredValue?: number;
    RequiresSeparateCustomsDeclaration: boolean;
    RequiresDutiesAndTaxesPrepayment: boolean;
    RequiresSpecialVatInvoice: boolean;
}

export interface ImportManifestActionResult {
    Success: boolean;
    ErrMsg: string;
    Data?: any;
}

export interface BulkDeleteRequest {
    Ids: number[];
}

export interface BulkDeleteResult {
    Success: boolean;
    Message: string;
    DeletedCount: number;
    SkippedCount: number;
    SkippedMessages: string[];
}

export interface DropdownOption {
    Id: number;
    Code: string;
    Name: string;
}

/** 附件类型下拉选项 */
export interface AttachmentTypeOption {
    id: number;
    name: string;
}

/** 随货资料展示项 */
export interface ForwardingDocumentItem {
    id?: number;
    token?: string;
    fileName: string;
    attachmentTypeId: number;
    attachmentTypeName: string;
    size?: number;
    uploadDate?: string;
    isPending?: boolean;
}

/** 临时上传结果 */
export interface UploadTempDocumentResult {
    success: boolean;
    token?: string;
    fileName?: string;
    attachmentTypeId?: number;
    attachmentTypeName?: string;
    size?: number;
    message?: string;
}

/** 附件列表响应 */
export interface ForwardingDocumentListResult {
    success: boolean;
    rows: ForwardingDocumentItem[];
}
