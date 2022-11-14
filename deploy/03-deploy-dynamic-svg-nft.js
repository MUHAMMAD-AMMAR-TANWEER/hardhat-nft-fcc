const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, logs } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("------------------------")
    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    const lowSvg = fs.readFileSync("./images/DynamicNft/frown.svg", { encoding: "utf-8" })
    const highSvg = fs.readFileSync("./images/DynamicNft/happy.svg", { encoding: "utf-8" })

    const args = [ethUsdPriceFeedAddress, lowSvg, highSvg]
    console.log("-------------------Deploying contract-------------------------------------")
    const DynamicNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.VERIFICATION_BLOCK_CONFIRMATIONS || 1,
    })

    console.log("________________Contract has been deployed_______")

    if (!developmentChains.includes(network.name) && process.env.ETHER_SCAN_API) {
        console.log("Verifying................")
        await verify(DynamicNft.address, args)
    }
    console.log("--------------------------------------")
}

module.exports.tags = ["all", "dynamicsvg", "main"]
