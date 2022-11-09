const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPS NFT test", function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock
          const FUND_AMOUNT = ethers.utils.parseEther("10")
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("Constructor", function () {
              it("Initialize the all variables correctly", async () => {
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()
                  const initialCounter = await randomIpfsNft.getTokenCounter()
                  const mintAmount = await randomIpfsNft.getMintFee()
                  const isIntialize = await randomIpfsNft.getInitialized()
                  const tokenUris = await randomIpfsNft.getDogTokenUris("0")

                  assert.equal(name, "Random IPFS NFT")
                  assert.equal(symbol, "RIN")
                  assert.equal(initialCounter.toString(), "0")
                  assert.equal(mintAmount.toString(), ethers.utils.parseEther("0.01"))
                  assert.equal(isIntialize, true)
                  assert(tokenUris.toString().includes("ipfs://"), true)
              })
          })

          describe("requestNft", function () {
              it("it reverts when not enough eth is sent", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })

              it("reverts if payment amount is less than the mint fee", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(
                      randomIpfsNft.requestNft({
                          value: fee.sub(ethers.utils.parseEther("0.001")),
                      })
                  ).to.be.revertedWith("RandomIpfsNft__NeedMoreETHSent")
              })

              it("emits an event and kicks off a random word request", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", function () {
              it("returns PUG when moddedRng <10", async () => {
                  const Breed = await randomIpfsNft.getBreedFromModdedRng(7)
                  assert.equal(0, Breed)
              })

              it("returns SHIBA_INU when moddedRng >10 and <30", async () => {
                  const Breed = await randomIpfsNft.getBreedFromModdedRng(25)
                  assert.equal(1, Breed)
              })

              it("returns St Bernard when moddedRng >30 and <99", async () => {
                  const Breed = await randomIpfsNft.getBreedFromModdedRng(45)
                  assert.equal(2, Breed)
              })

              it("reverts if value is greater then 99", async () => {
                  await expect(randomIpfsNft.getBreedFromModdedRng(200)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })
          })
      })

// [
//     ("ipfs://QmQL16y6RarVNfrYp7RGfF68ovbjAsyXePKjtdi9FBJRUw",
//     "ipfs://QmSMJMvN7CwNSCJpvWkpXhmB68matqFK3ZsgnyxtACE4dL",
//     "ipfs://QmUZufQGTE8W2mjrjt2SENyycjimjbCzwPC9yfaJRZ7oQk")
// ]
