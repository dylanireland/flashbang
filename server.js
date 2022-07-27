const { ethers } = require("ethers");
const { signMakerOrder, addressesByNetwork, SupportedChainId, MakerOrder, LooksRareExchangeAbi } = require("@looksrare/sdk");
const axios = require('axios');
const fs = require('fs')

const provider = new ethers.providers.getDefaultProvider(fs.readFileSync("./provider.txt").toString())

const rinkebyLRAPI = "https://api-rinkeby.looksrare.org"

let seller = new ethers.Wallet(fs.readFileSync("./seller.txt").toString())
let arber = new ethers.Wallet(fs.readFileSync("./arber.txt").toString())

const collection = "0x13791EB1b8B5348104B3349D0Eb7932C6cdb852a"

const chainId = SupportedChainId.RINKEBY

async function buy() {
  const addresses = addressesByNetwork[chainId];
  
  const takerOrder = {
    isOrderAsk: false,
    taker: arber.address,
    price: "10000000000000000", // Wei, 0.01 ETH
    tokenId: "1",
    minPercentageToAsk: 9800,
    params: []
  }

  const makerOrder = {
    isOrderAsk: true,
    signer: seller.address,
    collection: collection,
    price: "10000000000000000", // Wei, 0.01 ETH
    tokenId: "1",
    amount: "1",
    strategy: addresses.STRATEGY_STANDARD_SALE,
    currency: addresses.WETH,
    nonce: "0",
    startTime: "1658871743",
    endTime: "1661463658",
    minPercentageToAsk: "9800",
    params: []
  }

  const takerStruct = ethers.utils.AbiCoder.prototype.encode(
    ['bool', 'address', 'uint256', 'uint256', 'uint256', 'bytes'],
    [false, arber.address, "10000000000000000", 1, 9800, []]
  )

  const makerStruct = ethers.utils.AbiCoder.prototype.encode(
    ['bool', 'address', 'address', 'uint256', 'uint256', 'uint256', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
    [true, seller.address, collection, "10000000000000000", 1, 1, addresses.STRATEGY_STANDARD_SALE, addresses.WETH, 0, 1658871743, 1661463658, 9800, []]
  )


  arber = arber.connect(provider)
  const addy = ethers.utils.getAddress("0x1AA777972073Ff66DCFDeD85749bDD555C0665dA")
  let contract = new ethers.Contract(addy, LooksRareExchangeAbi, arber)

  let tx = await contract.matchAskWithTakerBidUsingETHAndWETH(takerStruct, makerStruct)

  tx.wait().then((result) => {
    console.log(result)
  }).catch((error) => {
    console.error(error)
  })
}

function getNonce(account) {
  return new Promise((resolve, reject) => {
    axios.get(rinkebyLRAPI + "/api/v1/orders/nonce?address=" + account).then((result) => {
      resolve(parseInt(result.data.data))
    }).catch((error) => {
      console.error("Error")
      reject(error)
    })
  })

}

buy()
