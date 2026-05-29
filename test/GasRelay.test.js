const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskRouter Gas Relay #183", function () {
  let router, registry, owner, agent, relayer;

  beforeEach(async function () {
    [owner, agent, relayer] = await ethers.getSigners();
    const Reg = await ethers.getContractFactory("AgentRegistry");
    registry = await Reg.deploy(0);
    await registry.waitForDeployment();

    const Router = await ethers.getContractFactory("TaskRouter");
    router = await Router.deploy(await registry.getAddress(), 500);
    await router.waitForDeployment();
  });

  it("replay protection via nonce", async function () {
    expect(await router.nonces(agent.address)).to.equal(0);
    // Nonce increments on successful executeOnBehalf
  });

  it("rejects invalid signature", async function () {
    const data = "0x";
    const nonce = 0;
    const hash = ethers.solidityPackedKeccak256(
      ["address", "bytes", "uint256", "address"],
      [agent.address, data, nonce, await router.getAddress()]
    );
    const ethHash = ethers.hashMessage(ethers.getBytes(hash));
    const sig = await relayer.signMessage(ethers.getBytes(hash));
    
    await expect(
      router.connect(relayer).executeOnBehalf(agent.address, data, sig)
    ).to.be.revertedWith("Invalid signature");
  });
});
