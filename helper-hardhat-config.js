const { ethers } = require("hardhat");

const networkConfig = {
  5: {
    name: "goerli",
    vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    subscriptionId: "7140",
    callbackGasLimit: "500000",
    interval: "30",
    mintFee: "10000000000000000",
    ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
  },

  31337: {
    name: "hardhat",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    subscriptionId: "588",
    callbackGasLimit: "500000",
    interval: "30",
    mintFee: "10000000000000000",
  },
};

const developmentChains = ["hardhat", "localhost"];

const frontEndContractsFile = "../thegraph-nextjs-nft-marketplace/constants/networkMapping.json"
const frontEndContractsFile2 =
"../thegraph-nextjs-nft-marketplace/constants/networkMapping.json"
const frontEndAbiLocation = "../thegraph-nextjs-nft-marketplace/constants/"
const frontEndAbiLocation2 = "../thegraph-nextjs-nft-marketplace/constants/networkMapping.json"


module.exports = {
  networkConfig,
  developmentChains,
  frontEndContractsFile,
  frontEndAbiLocation2,
  frontEndContractsFile2,
  frontEndAbiLocation
};
