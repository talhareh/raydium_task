import {
    Connection,
    PublicKey,
    ParsedInstruction,
    ParsedConfirmedTransaction,
  } from '@solana/web3.js';
  
  const TOKEN_ADDRESS = '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump';
  const RAYDIUM_MIGRATOR_PROGRAM = '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg';
  const CLUSTER_URL = 'https://api.mainnet-beta.solana.com';
  
  const connection = new Connection(CLUSTER_URL, 'confirmed');
  
  async function findLPTokenAddress() {
    const tokenPublicKey = new PublicKey(TOKEN_ADDRESS);
    const migratorPublicKey = new PublicKey(RAYDIUM_MIGRATOR_PROGRAM);
  
    // Fetch signatures for transactions involving the token address
    const signatures = await connection.getSignaturesForAddress(tokenPublicKey);
  
    for (const signatureInfo of signatures) {
      const tx = await connection.getParsedConfirmedTransaction(signatureInfo.signature);
  
      if (tx && tx.transaction.message.instructions) {
        // Filter for transactions involving the Raydium Migrator Program
        const migratorInstruction = tx.transaction.message.instructions.find(
          (inst: ParsedInstruction) =>
            inst.programId.toBase58() === migratorPublicKey.toBase58()
        );
  
        if (migratorInstruction) {
          // Check for `initializeAccount2` instruction
          const instructionData = migratorInstruction.parsed;
          if (instructionData && instructionData.type === 'initializeAccount2') {
            // Extract LP token address from the instruction
            const lpTokenAddress = instructionData.info.tokenAccount;
            console.log(`Found LP Token Address: ${lpTokenAddress}`);
            return lpTokenAddress;
          }
        }
      }
    }
  
    console.log('No LP Token Address found in the transactions.');
    return null;
  }
  
  findLPTokenAddress().catch((err) => console.error(err));
  