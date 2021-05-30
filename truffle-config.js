// https://github.com/trufflesuite/truffle/tree/develop/packages/hdwallet-provider
const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraKey = "";

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {

  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: ''
  },

  networks: {

    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      gas: 6721975,
      gasPrice: 10000000000,   // 10Gwei
    },

    hardhat: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      gas: 6721975,
      gasPrice: 10000000000,   // 10Gwei
    },

    // Another network with more advanced options...
    // advanced: {
      // port: 8777,             // Custom port
      // network_id: 1342,       // Custom network
      // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
      // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
      // from: <address>,        // Account to send txs from (default: accounts[0])
      // websockets: true        // Enable EventEmitter interface for web3 (default: false)
    // },

    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraKey}`),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      gasPrice: 80000000000,   // 80Gwei
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    goerli: {
      provider: function() {   // link ok 
        return new HDWalletProvider(mnemonic, "https://eth-goerli.alchemyapi.io/v2/KfJMaeuX2N748ZGKHp3gDldDoENaJ4Ma")
      },
      network_id: 5,
      gas: 7003605,
      gasPrice: 45000000000,  // 40Gwei
    },
    
    heco: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://http-mainnet.hecochain.com")
      },
      network_id: 128,
      gas: 7003605,
      gasPrice: 2000000000,   // 2Gwei
    },

    testheco: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://http-testnet.hecochain.com")
      },
      network_id: 256,
      gas: 7003605,
      gasPrice: 2000000000,   // 2Gwei
    },

    okextest: {
      provider: function() {
        // https://okexchain-docs.readthedocs.io/en/latest/developers/blockchainDetail/aminorpc.html#mainnet-chain-id-okexchain-66
        return new HDWalletProvider(mnemonic, "https://exchaintest.okexcn.com")
        // return new HDWalletProvider(mnemonic, "http://okexchaintest-rpc1.okex.com:26657")
        // return new HDWalletProvider(mnemonic, "http://okexchaintest-rpc1.okexcn.com:26657")
      },
      network_id: 65,
      gas: 8189082,
      gasPrice: 2000000000,   // 2Gwei
    },

    main: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/v3/d3fe47cdbf454c9584113d05a918694f")
      },
      network_id: 1,
      gas: 1821530,
      gasPrice: 80000000000,   // 80Gwei
    }

    // Useful for private networks
    // private: {
      // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
      // network_id: 2111,   // This network is yours, in the cloud.
      // production: true    // Treats this network as if it was a public net. (default: false)
    // }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
    reporter: 'eth-gas-reporter',
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.9",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
      optimizer: {
        enabled: true,
        runs: 200
      },
      //  evmVersion: "byzantium"
      }
    }
  }
}
