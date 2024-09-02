export class FaDaDaAuthResult{
    ClientUserId: string;
    ClientCorpId: string;
    Signature: string;
    AuthResult: string;
    OpenUserId: string;
    OpenCorpId: string;
    AuthScope: string;
    Timestamp: string;
    
    constructor(data:any) {
        this.ClientUserId = data.clientUserId;
        this.ClientCorpId = data.clientCorpId;
        this.Signature = data.signature;
        this.AuthResult = data.authResult;
        this.OpenUserId = data.openUserId;
        this.OpenCorpId = data.openCorpId;
        this.AuthScope = data.authScope;
        this.Timestamp = data.timestamp;
    }
}