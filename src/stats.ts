import axios, { AxiosResponse } from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';

interface TokenMetadata {
    symbol: string;
    name: string;
}

interface PriceDataPoint {
    time: number;
    price: number;
    volume: number;
}

interface RaydiumPriceResponse {
    data: PriceDataPoint[];
    marketCap: number;
    volume24h: number;
}

interface TokenAccountBalance {
    value: {
        uiAmount: number;
    };
}

interface TokenHolder {
    address: string;
    balance: number;
}

interface TokenAnalytics {
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    volume24h: number;
    holders: number;
    priceHistory: PriceHistory[];
}

interface PriceHistory {
    timestamp: number;
    price: number;
    volume: number;
}

export class SolanaTokenAnalytics {
    private readonly connection: Connection;
    
    constructor(private readonly tokenMintAddress: string) {
        this.connection = new Connection('https://api.mainnet-beta.solana.com');
    }

    public async getTokenInfo(): Promise<TokenAnalytics> {
        try {
            // Get token metadata from Raydium API
            const raydiumResponse: AxiosResponse<TokenMetadata> = await axios.get(
                `https://api.raydium.io/v2/main/token/${this.tokenMintAddress}`
            );
            const tokenData: TokenMetadata = raydiumResponse.data;

            // Get price and liquidity data
            const priceData = await this.getPriceData();
            
            // Get holder count
            const holderCount = await this.getHolderCount();

            return {
                symbol: tokenData.symbol,
                name: tokenData.name,
                price: priceData.currentPrice,
                marketCap: priceData.marketCap,
                volume24h: priceData.volume24h,
                holders: holderCount,
                priceHistory: priceData.priceHistory
            };
        } catch (error) {
            console.error('Error fetching token info:', error);
            throw error;
        }
    }

    private async getPriceData(): Promise<{
        currentPrice: number;
        marketCap: number;
        volume24h: number;
        priceHistory: PriceHistory[];
    }> {
        try {
            const now: number = Math.floor(Date.now() / 1000);
            const fourHoursAgo: number = now - (4 * 60 * 60);
            
            const priceResponse: AxiosResponse<RaydiumPriceResponse> = await axios.get(
                `https://api.raydium.io/v2/main/price/${this.tokenMintAddress}`,
                {
                    params: {
                        from: fourHoursAgo,
                        to: now,
                        interval: '4h'
                    }
                }
            );

            const priceHistory: PriceHistory[] = priceResponse.data.data.map(item => ({
                timestamp: item.time,
                price: item.price,
                volume: item.volume
            }));

            return {
                currentPrice: priceHistory[priceHistory.length - 1].price,
                marketCap: priceResponse.data.marketCap,
                volume24h: priceResponse.data.volume24h,
                priceHistory
            };
        } catch (error) {
            console.error('Error fetching price data:', error);
            throw error;
        }
    }

    private async getHolderCount(): Promise<number> {
        try {
            const mint = new PublicKey(this.tokenMintAddress);
            const tokenAccounts = await this.connection.getTokenLargestAccounts(mint);
            
            const holders: TokenHolder[] = await Promise.all(
                tokenAccounts.value.map(async account => {
                    const accountInfo: TokenAccountBalance = await this.connection.getTokenAccountBalance(
                        account.address
                    ) as TokenAccountBalance;
                    
                    return {
                        address: account.address.toString(),
                        balance: accountInfo.value.uiAmount
                    };
                })
            );

            return holders.filter(holder => holder.balance > 0).length;
        } catch (error) {
            console.error('Error fetching holder count:', error);
            throw error;
        }
    }
}

const main = async (): Promise<void> => {
    try {
        
        const tokenMintAddress: string = 'YOUR_TOKEN_MINT_ADDRESS';   // pass token address here
        const analytics = new SolanaTokenAnalytics(tokenMintAddress);
        const tokenInfo: TokenAnalytics = await analytics.getTokenInfo();
        
        console.log('Token Information:');
        console.log(JSON.stringify(tokenInfo, null, 2));
        
        // Access specific data
        console.log(`\nCurrent Price: $${tokenInfo.price}`);
        console.log(`Market Cap: $${tokenInfo.marketCap}`);
        console.log(`24h Volume: $${tokenInfo.volume24h}`);
        console.log(`Number of Holders: ${tokenInfo.holders}`);
        
        // Print 4h interval price history
        console.log('\nPrice History (4h intervals):');
        tokenInfo.priceHistory.forEach((entry: PriceHistory): void => {
            const date = new Date(entry.timestamp * 1000);
            console.log(`Time: ${date.toISOString()}, Price: $${entry.price}, Volume: $${entry.volume}`);
        });
    } catch (error) {
        console.error('Error in main:', error);
    }
};

main();