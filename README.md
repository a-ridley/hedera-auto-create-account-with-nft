# Example for [HIP-542](https://hips.hedera.com/hip/hip-542)
## Auto-Account creation when sending an NFT to an alias
### Example Steps
1. Create a treasury account
2. Create an NFT collection using the Hedera Token Service
3. Create an ECDSA public key alias
4. Transfer an NFT to the public key alias using the transfer transaction
5. Return the new account ID in the child record
6. Show the new account ID owns the NFT


## How to run
Create a .env file with your testnet credentials. Need a testnet account? Register for a Hedera testnet account [here](https://portal.hedera.com/register). Recieve 10,000 test hbar every 24 hours!

`npm i`

`npm run start`
