const { expect, assert } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT TEST", function () {
          let deployer, BasicNft
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              BasicNft = await ethers.getContract("BasicNft")
          })
          //test01 completed
          describe("Constructor", () => {
              it("Initializes the nft correctly", async () => {
                  const name = await BasicNft.name()
                  const symbol = await BasicNft.symbol()
                  const counter = await BasicNft.getTokenCounter()
                  assert.equal(counter.toString(), "0")
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
              })
          })

          //test02
          describe("Mint NFT", () => {
              beforeEach(async () => {
                  const txResponse = await BasicNft.mintNft()
                  await txResponse.wait(1)
              })
              it("allows user to Mint NFT and store properly", async () => {
                  const TokenURI = await BasicNft.tokenURI(0)
                  const counter = await BasicNft.getTokenCounter()

                  assert.equal(counter.toString(), "1")
                  assert.equal(TokenURI, await BasicNft.TOKEN_URI())
              })
              it("Shows the correct balance of owner", async () => {
                  const deployerAddress = deployer.address
                  const OwnerBalance = await BasicNft.balanceOf(deployerAddress)
                  const owner = await BasicNft.ownerOf(1)

                  assert.equal(deployerAddress, owner)
                  assert.equal(OwnerBalance.toString(), "1")
              })
          })
      })
