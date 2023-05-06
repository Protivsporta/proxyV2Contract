## Layout

-   `contracts` - contains the source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - contains the wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts. Would typically use the wrappers.
-   `scripts` - contains scripts used by the project, mainly the deployment scripts.   
-   `scripts/utils` - contains helpers for encryption and enums for SC opcodes.

## Repo contents / tech stack
1. Compiling FunC - [https://github.com/ton-community/func-js](https://github.com/ton-community/func-js)
2. Testing TON smart contracts - [https://github.com/ton-community/sandbox](https://github.com/ton-community/sandbox)
3. Deployment of contracts is supported with [TON Connect 2](https://github.com/ton-connect/), [Tonhub wallet](https://tonhub.com/), using mnemonics, or via a direct `ton://` deeplink

## How to use
* Run `npm create ton@latest`

### Building a contract
1. Interactively
   1. Run `yarn blueprint build`
   2. Choose the contract you'd like to build
1. Non-interactively
   1. Run `yarn blueprint build <CONTRACT>`
   2. example: `yarn blueprint build pingpong`

### Deploying a contract
1. Interactively
   1. Run `yarn blueprint run`
   2. Choose the contract you'd like to deploy
   3. Choose whether you're deploying on mainnet or testnet
   4. Choose how to deploy:
      1. With a TON Connect compatible wallet
      2. A `ton://` deep link / QR code
      3. Tonhub wallet
      4. Mnemonic
   5. Deploy the contract
2. Non-interactively
   1. Run `yarn blueprint run <CONTRACT> --<NETWORK> --<DEPLOY_METHOD>`
   2. example: `yarn blueprint run pingpong --mainnet --tonconnect`

### Testing
1. Run `npx blueprint tests`

### Available Tasks
1. deposit 
2. withdraw
3. changeOwner
4. selfdestruct
  
# License
MIT
