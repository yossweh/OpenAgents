const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry #172", function () {
  let registry, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const R = await ethers.getContractFactory("AgentRegistry");
    registry = await R.deploy(0);
    await registry.waitForDeployment();
  });

  it("same name same block gets different IDs", async function () {
    const id1 = await registry.connect(user1).registerAgent.staticCall("Agent1", "ep1");
    await registry.connect(user1).registerAgent("Agent1", "ep1");
    const id2 = await registry.connect(user2).registerAgent.staticCall("Agent1", "ep2");
    await registry.connect(user2).registerAgent("Agent1", "ep2");
    expect(id1).to.not.equal(id2);
  });

  it("IDs are sequential", async function () {
    const id1 = await registry.connect(user1).registerAgent.staticCall("A1", "ep1");
    await registry.connect(user1).registerAgent("A1", "ep1");
    const id2 = await registry.connect(user2).registerAgent.staticCall("A2", "ep2");
    await registry.connect(user2).registerAgent("A2", "ep2");
    expect(id1).to.equal(ethers.zeroPadValue("0x00", 32));
    expect(id2).to.equal(ethers.zeroPadValue("0x01", 32));
  });
});
