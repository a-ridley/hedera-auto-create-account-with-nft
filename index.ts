
import {
  AccountId,
  PrivateKey,
  Client,
  AccountInfoQuery,
} from "@hashgraph/sdk";

import dotenv from "dotenv";
import { createAccount, getAccountIdByAlias } from "./services/hederaAccountService";
import { createNewNftCollection, getNftOwnerByNftId, transferNft } from "./services/hederaTokenService";

dotenv.config();

/*
 * Example for HIP-542

 * ## Example 1: account creation with NFT
 * ### Steps
 * 1. Create a Treasury account
 * 2. Create an NFT collection using the Hedera Token Service
 * 3. Create an ECDSA public key alias
 * 4. Transfer the NFT to the public key alias using the transfer transaction
 * 5. Return the new account ID in the child record
 * 6. Show the new account ID owns the NFT
*/

// create your client
const accountIdString = process.env.OPERATOR_ACCOUNT_ID;
const privateKeyString = process.env.OPERATOR_PRIVATE_KEY;
if (accountIdString === undefined || privateKeyString === undefined) { throw new Error('account id and private key in env file are empty') }

const operatorAccountId = AccountId.fromString(accountIdString);
const operatorPrivateKey = PrivateKey.fromString(privateKeyString);

const client = Client.forTestnet().setOperator(operatorAccountId, operatorPrivateKey);

const accountCreationWithNFT = async () => {
  const [treasuryAccId, treasuryAccPvKey] = await createAccount(client, 100);
  console.log(`- Treasury's account: https://hashscan.io/#/testnet/account/${treasuryAccId}`);
  console.log(`- Treasury's private key: ${treasuryAccPvKey}`);

  // IPFS content identifiers for the NFT metadata
  const metadataIPFSUrls: Buffer[] = [
    Buffer.from("ipfs://bafkreiap62fsqxmo4hy45bmwiqolqqtkhtehghqauixvv5mcq7uofdpvt4"),
    Buffer.from("ipfs://bafkreibvluvlf36lilrqoaum54ga3nlumms34m4kab2x67f5piofmo5fsa"),
    Buffer.from("ipfs://bafkreidrqy67amvygjnvgr2mgdgqg2alaowoy34ljubot6qwf6bcf4yma4"),
    Buffer.from("ipfs://bafkreicoorrcx3d4foreggz72aedxhosuk3cjgumglstokuhw2cmz22n7u"),
    Buffer.from("ipfs://bafkreidv7k5vfn6gnj5mhahnrvhxep4okw75dwbt6o4r3rhe3ktraddf5a"),
  ];

  /**
   * Step 2
   * Create nft collection
  */
  const nftCreateTxnResponse = await createNewNftCollection(client, 'HIP-542 Example Collection', 'HIP-542', metadataIPFSUrls, treasuryAccId, treasuryAccPvKey);

  /**
   * Step 3
   * Create an ECDSA public key alias
  */
  console.log('- Creating a new account...\n');

  const privateKey = PrivateKey.generateECDSA();
  const publicKey = privateKey.publicKey;

  // Assuming that the target shard and realm are known.
  // For now they are virtually always 0 and 0.
  const aliasAccountId = publicKey.toAccountId(0, 0);

  console.log(`- New account ID: ${aliasAccountId.toString()}`);
  if (aliasAccountId.aliasKey === null) { throw new Error('alias key is empty') }
  console.log(`- Just the aliasKey: ${aliasAccountId.aliasKey.toString()}\n`);


  /**
   * Step 4
   * Tranfer the NFT to the public key alias using the transfer transaction
  */
   console.log('- Transferring the NFT...\n');
  const nftTokenId = nftCreateTxnResponse.tokenId;
  const exampleNftId = 1;
  await transferNft(client, nftTokenId, exampleNftId, treasuryAccId, treasuryAccPvKey, aliasAccountId);

  /**
  * Step 5
  * 
  * Return the new account ID
 */
   const accountId = await getAccountIdByAlias(client, aliasAccountId);
   console.log(`The normal account ID of the given alias: ${accountId}`);

  /**
 * Step 6
 *
 * Show the new account ID owns the NFT
 */
  const nftOwnerAccountId = await getNftOwnerByNftId(client, nftTokenId, exampleNftId);

  nftOwnerAccountId === accountId.toString()
    ? console.log(
      `The NFT owner accountId matches the accountId created with the HTS\n`
    )
    : console.log(`The two account IDs does not match\n`);
    
  client.close();
}
accountCreationWithNFT();