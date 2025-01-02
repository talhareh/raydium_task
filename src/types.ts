export interface PoolInitializationData {
    signature: string;
    tokenAddress: string;
    liquidityAddress: string;
    timestamp: Date;
}

export interface BlockSubscriptionMessage {
    jsonrpc: "2.0";
    id: number;
    method: string;
    params: [
        string,
         
        {
            mentions: [string];
        }
    ];
}

export interface TransactionData {
    transaction: {
        signatures: string[];
        message: {
            accountKeys: string[];
        };
    };
    meta?: {
        logMessages?: string[]; // Ensure logMessages is optional since it might not always exist
    };
}

export interface BlockNotification {
    method: string;
    params: {
        result: {
            value: {
                block: {
                    transactions: TransactionData[]; // Correctly defines transactions as an array
                };
            };
        };
    };
}