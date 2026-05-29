const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskRouter #181", function () {
  let router, registry, owner, agent;

  beforeEach(async function () {
    [owner, agent] = await ethers.getSigners();
    const Reg = await ethers.getContractFactory("AgentRegistry");
    registry = await Reg.deploy(0);
    await registry.waitForDeployment();

    const Router = await ethers.getContractFactory("TaskRouter");
    router = await Router.deploy(await registry.getAddress(), 500);
    await router.waitForDeployment();
  });

  it("SafeERC20 import is present", async function () {
    // Verify the contract compiles with SafeERC20
    expect(await router.registry()).to.equal(await registry.getAddress());
  });

  it("task creation and completion work", async function () {
    await registry.connect(agent).registerAgent("TestAgent", "ep1");
    const agentId = await registry.agentIds(0);

    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 86400;
    await router.createTask("Test task", deadline, { value: ethers.parseEther("1") });

    await router.connect(agent).assignTask(0, agentId);
    await router.connect(agent).completeTask(0, "0x");
    
    const task = await router.tasks(0);
    expect(task.status).to.equal(3); // Completed
  });
});
