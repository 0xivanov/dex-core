import hre from 'hardhat'

const mineBlocks = async function (numberOfBlocks: Number) {
    await hre.network.provider.send("hardhat_mine", [`0x${numberOfBlocks}`]);
};

module.exports = { mineBlocks };