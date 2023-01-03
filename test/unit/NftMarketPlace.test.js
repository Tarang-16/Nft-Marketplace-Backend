const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketPlace Unit Test", function () {
          let nftMarketPlace, deployer, basicNft, player
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              //deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              // player = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              // nftMarketPlace = await ethers.getContract("NftMarketPlace", player)  This is used to connect to another account named player.
              nftMarketPlace = await ethers.getContract("NftMarketPlace", deployer.address)
              basicNft = await ethers.getContract("BasicNft")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
          })

          describe("list items", function () {
              it("reverts when enough Price is not set", async function () {
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__PriceMustBeAboveZero"
                  )
                  //   await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  //   const PlayerNftMarketPlace = nftMarketPlace.connect(player)
                  //   await PlayerNftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  //   const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  //   const deployerProceeds = await nftMarketPlace.getProceeds(deployer)
                  //   assert(newOwner.toString() == player.address)
                  //   assert(deployerProceeds.toString() == PRICE.toString())
              })

              it("emits an event when an item is listed", async function () {
                  await expect(nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketPlace,
                      "ItemListed"
                  )
              })

              it("prevents relisting of already listed items", async function () {
                  nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__AlreadyListed")
              })

              it("allows only owner to list the nft", async function () {
                  const PlayerNftMarketPlace = nftMarketPlace.connect(player)
                  await expect(
                      PlayerNftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(PlayerNftMarketPlace, "NftMarketPlace__NotOwner")
              })

              it("needs approval to list items", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__NotApprovedForMarketPlace"
                  )
              })

              it("Updates listing with seller and price", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == PRICE.toString())
                  assert(listing.seller.toString() == deployer.address)
              })
          })

          describe("buy Item", function () {
              it("reverts if enough Eth is not sent", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__PriceNotMet")
              })

              it("updates the proceeds", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const PlayerNftMarketPlace = nftMarketPlace.connect(player)
                  await PlayerNftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketPlace.getProceeds(deployer.address)
                  assert(newOwner.toString() == player.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })

              it("emits an event when an item is bought", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit(nftMarketPlace, "ItemBought")
              })
          })

          describe("Cancel Listing", function () {
              it("cancels the listing on owner's request and emits", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      nftMarketPlace,
                      "ItemCanceled"
                  )
              })
          })

          describe("update listing", function () {
              it("reverts when price is not set correctly", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__PriceMustBeAboveZero"
                  )
              })

              it("emits when the price is updated", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, 2)).to.emit(
                      nftMarketPlace,
                      "ItemListed"
                  )
              })
          })

          describe("Withdraw Proceeds", async function () {
              it("reverts when proceed is not enough", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  //const PlayerNftMarketPlace = nftMarketPlace.connect(player)
                  //await PlayerNftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  //const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  //const deployerProceeds = await nftMarketPlace.getProceeds(deployer)
                  await expect(nftMarketPlace.withdrawProceeds()).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__NoProceeds"
                  )
              })

              it("withdraws proceeds", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const PlayerNftMarketPlace = nftMarketPlace.connect(player)
                  await PlayerNftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const deployerProceeds = await nftMarketPlace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketPlace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()

                  assert.equal(
                      deployerBalanceBefore.add(deployerProceeds).toString(),
                      deployerBalanceAfter.add(gasCost).toString()
                  )
              })
          })
      })
