import { PublicKey } from "@solana/web3.js";

export const CONFIG = {

    WSS_ENDPOINT: "wss://api.mainnet-beta.solana.com",

    RAYDIUM_LIQUIDITY_POOL_PROGRAM_ID: new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),

    PUMP_LIQUIDITY_MIGRATOR: new PublicKey("39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg"),

    
    TOKEN_WATCHLIST: [
        "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump"
    ] as string[]
};