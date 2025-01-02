import WebSocket from 'ws';
import { CONFIG } from './config';
import {
    BlockSubscriptionMessage,
    PoolInitializationData,
    TransactionData,
    BlockNotification
} from './types';
import { Logger } from './logger';

class RaydiumPoolListener {
    private logger: Logger;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelay = 5000; 
    public counter = 0;

    constructor() {
        this.logger = new Logger();
    
    }
    

    private validateTokenAddress(tokenAddress: string): boolean {
        try {
            if (!CONFIG.TOKEN_WATCHLIST.length) {
                return true;
            }
            return CONFIG.TOKEN_WATCHLIST.includes(tokenAddress);
        } catch (error) {
            this.logger.error(`Error validating token address: ${error}`);
            return false;
        }
    }

    private processInitialize2Transaction(data: TransactionData): PoolInitializationData | null {
        try {
            const signature = data.transaction.signatures[0];
            const accountKeys = data.transaction.message.accountKeys;

            if (accountKeys.length <= 18) {
                this.logger.error(`Not enough account keys (found ${accountKeys.length})`);
                return null;
            }

            const tokenAddress = accountKeys[18];
            const liquidityAddress = accountKeys[2];

            if (!this.validateTokenAddress(tokenAddress)) {
                this.logger.info(`Skipping non-watched token: ${tokenAddress}`);
                return null;
            }

            const poolData: PoolInitializationData = {
                signature,
                tokenAddress,
                liquidityAddress,
                timestamp: new Date()
            };

            this.logger.info('\nNew pool initialization detected:');
            this.logger.info(`Signature: ${poolData.signature}`);
            this.logger.info(`Token Address: ${poolData.tokenAddress}`);
            this.logger.info(`Liquidity Address: ${poolData.liquidityAddress}`);
            this.logger.info('='.repeat(50));

            return poolData;

        } catch (error) {
            this.logger.error(`Error processing transaction: ${error}`);
            return null;
        }
    }

    private async storePoolData(poolData: PoolInitializationData): Promise<void> {
        console.log('In logs')
    }

    private createSubscriptionMessage(): BlockSubscriptionMessage {
        return {
            jsonrpc: "2.0",
            id: 1,
            method: "logsSubscribe",
            params: [
                "all", 
                {
                    mentions: [CONFIG.PUMP_LIQUIDITY_MIGRATOR.toString()]
                }
            ]
        };
    }
    

    private setupWebSocket(): void {
        this.ws = new WebSocket(CONFIG.WSS_ENDPOINT);

        this.ws.on('open', () => {
            this.logger.info('WebSocket connection established');
            this.reconnectAttempts = 0;
            const subscriptionMessage = this.createSubscriptionMessage();
            this.ws?.send(JSON.stringify(subscriptionMessage));
        });

        this.ws.on('message', async (data: WebSocket.Data) => {
            try {

                //console.log('\n\ndaata : ', data)
                const response = JSON.parse(data.toString()) ;
                //console.log('count : ', this.counter++, " : ", response.method)
                if (response.method === 'logsNotification') {
                    const logs = response.params.result.value.logs || [];
        
                    logs.forEach((log : any) => {
                        console.log("\n\n data : ", log)
                        if (log.includes("Program log: Instruction: InitializeAccou")) {
                            console.log("\n\nRelevant log found: ", log);
                        }
                    });
                }
            } catch (error) {
                console.error(`Error processing message: ${error}`);
            }
        });
        

        this.ws.on('error', (error) => {
            this.logger.error(`WebSocket error: ${error}`);
        });

        this.ws.on('close', () => {
            this.logger.info('WebSocket connection closed');
            this.handleReconnection();
        });
    }

    private handleReconnection(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            this.logger.info(`Attempting to reconnect in ${delay / 1000} seconds...`);
            
            setTimeout(() => {
                this.setupWebSocket();
            }, delay);
        } else {
            this.logger.error('Max reconnection attempts reached. Stopping reconnection.');
        }
    }

    public start(): void {
        this.logger.info('Starting Raydium pool initialization listener...');
        this.setupWebSocket();
    }
}

const listener = new RaydiumPoolListener();
listener.start();