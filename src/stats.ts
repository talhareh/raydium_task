const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');

class SolanaTokenAnalytics {
    constructor(tokenMintAddress) {
        this.tokenMintAddress = tokenMintAddress;
        this.connection = new Connection('https://api.mainnet-beta.solana.com');
    }

    async getTokenInfo() {
        try {
            // Get token metadata from Raydium API
            const raydiumResponse = await axios.get(`https://api.raydium.io/v2/main/token/${this.tokenMintAddress}`);
            const tokenData = raydiumResponse.data;

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

    async getPriceData() {
        try {
            // Get 4h interval data from Raydium API
            const now = Math.floor(Date.now() / 1000);
            const fourHoursAgo = now - (4 * 60 * 60);
            
            const priceResponse = await axios.get(
                `https://api.raydium.io/v2/main/price/${this.tokenMintAddress}`,
                {
                    params: {
                        from: fourHoursAgo,
                        to: now,
                        interval: '4h'
                    }
                }
            );

            const priceHistory = priceResponse.data.data.map(item => ({
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

    async getHolderCount() {
        try {
            // Get token holder count using Solana connection
            const mint = new PublicKey(this.tokenMintAddress);
            const tokenAccounts = await this.connection.getTokenLargestAccounts(mint);
            const holders = await Promise.all(
                tokenAccounts.value.map(async account => {
                    const accountInfo = await this.connection.getTokenAccountBalance(account.address);
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

// Example usage
async function main() {
    try {
        // Replace with your token's mint address
        const tokenMintAddress = 'YOUR_TOKEN_MINT_ADDRESS';
        const analytics = new SolanaTokenAnalytics(tokenMintAddress);
        const tokenInfo = await analytics.getTokenInfo();
        
        console.log('Token Information:');
        console.log(JSON.stringify(tokenInfo, null, 2));
        
        // Access specific data
        console.log(`\nCurrent Price: $${tokenInfo.price}`);
        console.log(`Market Cap: $${tokenInfo.marketCap}`);
        console.log(`24h Volume: $${tokenInfo.volume24h}`);
        console.log(`Number of Holders: ${tokenInfo.holders}`);
        
        // Print 4h interval price history
        console.log('\nPrice History (4h intervals):');
        tokenInfo.priceHistory.forEach(entry => {
            const date = new Date(entry.timestamp * 1000);
            console.log(`Time: ${date.toISOString()}, Price: $${entry.price}, Volume: $${entry.volume}`);
        });
    } catch (error) {
        console.error('Error in main:', error);
    }
}

main();