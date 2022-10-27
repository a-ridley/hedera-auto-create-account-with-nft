import { TokenCreateTransaction, Hbar, TokenType, TokenAssociateTransaction, Client, AccountId, PrivateKey, TokenMintTransaction, TokenId, TokenNftInfoQuery, NftId, TokenNftInfo, TransferTransaction } from '@hashgraph/sdk';

export const createNonFungibleToken = async (
  client: Client,
  treasureyAccId: string | AccountId,
  supplyKey: PrivateKey,
  treasuryAccPvKey: PrivateKey,
  initialSupply: number,
  tokenName: string,
  tokenSymbol: string,
): Promise<[TokenId | null, string]> => {
  /* 
    * Create a transaction with token type fungible
    * Returns Fungible Token Id and Token Id in solidity format
  */
  const createTokenTxn = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(treasureyAccId)
    .setSupplyKey(supplyKey)
    .setAdminKey(treasuryAccPvKey)
    .setMaxTransactionFee(new Hbar(30))
    .freezeWith(client); //freeze tx from from any further mods.

  const createTokenTxnSigned = await createTokenTxn.sign(treasuryAccPvKey);
  // submit txn to hedera network
  const txnResponse = await createTokenTxnSigned.execute(client);
  // request receipt of txn
  const txnRx = await txnResponse.getReceipt(client);
  const txnStatus = txnRx.status.toString();
  const tokenId = txnRx.tokenId;
  if (tokenId === null) { throw new Error("Somehow tokenId is null."); }

  const tokenIdInSolidityFormat = tokenId.toSolidityAddress();

  console.log(
    `Token Type Creation was a ${txnStatus} and was created with token id: ${tokenId}`
  );

  return [tokenId, tokenIdInSolidityFormat];
};

export const mintToken = async (client: Client, tokenId: string | TokenId, metadatas: Uint8Array[], supplyKey: PrivateKey) => {

  const mintTokenTxn = new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata(metadatas)
    .freezeWith(client);

  const mintTokenTxnSigned = await mintTokenTxn.sign(supplyKey);

  // submit txn to hedera network
  const txnResponse = await mintTokenTxnSigned.execute(client);

  const mintTokenRx = await txnResponse.getReceipt(client);
  const mintTokenStatus = mintTokenRx.status.toString();

  console.log(`Token mint was a ${mintTokenStatus}`);
};

export const createNewNftCollection = async (
  client: Client,
  tokenName: string,
  tokenSymbol: string,
  metadataIPFSUrls: Buffer[], // already uploaded ipfs metadata json files
  treasuryAccountId: string | AccountId,
  treasuryAccountPrivateKey: PrivateKey,
): Promise<{
  tokenId: TokenId,
  supplyKey: PrivateKey,
}> => {
  // generate supply key
  const supplyKey = PrivateKey.generateECDSA();

  const [tokenId,] = await createNonFungibleToken(client, treasuryAccountId, supplyKey, treasuryAccountPrivateKey, 0, tokenName, tokenSymbol);
  if (tokenId === null || tokenId === undefined) {
    throw new Error("Somehow tokenId is null");
  }

  const metadatas: Uint8Array[] = metadataIPFSUrls.map(url => Buffer.from(url));

  // mint token
  await mintToken(client, tokenId, metadatas, supplyKey);
  return {
    tokenId: tokenId,
    supplyKey: supplyKey,
  };
}
export const getNftOwnerByNftId = async (client: Client, nftTokenId: TokenId, exampleNftId: number) => {
  const nftInfo = await new TokenNftInfoQuery()
    .setNftId(new NftId(nftTokenId, exampleNftId))
    .execute(client);

  if (nftInfo === null) { throw new Error('nftInfo is null.') }
  const nftOwnerAccountId = nftInfo[0].accountId.toString();
  console.log(`- Current owner account id: ${nftOwnerAccountId} for NFT with serial number: ${exampleNftId}`);
  
  return nftOwnerAccountId;
}

export const transferNft = async (client: Client, nftTokenId: TokenId, nftId: number, treasuryAccId: AccountId, treasuryAccPvKey: PrivateKey, aliasAccountId: AccountId) => {
  const nftTransferTx = new TransferTransaction()
    .addNftTransfer(nftTokenId, nftId, treasuryAccId, aliasAccountId)
    .freezeWith(client);

  // Sign the transaction with the treasury account private key
  const nftTransferTxSign = await nftTransferTx.sign(treasuryAccPvKey);

  // Submit the transaction to the Hedera network
  const nftTransferSubmit = await nftTransferTxSign.execute(client);

  // Get transaction receipt information here
  await nftTransferSubmit.getReceipt(client);

}