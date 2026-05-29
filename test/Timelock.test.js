const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Timelock #201", function () {
  let timelock, admin, user;
  const DAY = 86400;
  const DELAY = DAY * 2;

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    const T = await ethers.getContractFactory("Timelock");
    timelock = await T.deploy(admin.address, DELAY);
    await timelock.waitForDeployment();
  });

  it("reverts execute after grace period", async function () {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const eta = now + DELAY + 1;
    await timelock.queueTransaction(admin.address, 0, "0x", eta);
    await ethers.provider.send("evm_setNextBlockTimestamp", [eta + 14 * DAY + 1]);
    await expect(timelock.executeTransaction(admin.address, 0, "0x", eta)).to.be.revertedWith("Timelock: tx stale");
  });

  it("executes within window", async function () {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const eta = now + DELAY + 1;
    await timelock.queueTransaction(admin.address, 0, "0x", eta);
    await ethers.provider.send("evm_setNextBlockTimestamp", [eta]);
    await expect(timelock.executeTransaction(admin.address, 0, "0x", eta)).to.not.be.reverted;
  });

  it("reverts setDelay without admin", async function () {
    await expect(timelock.connect(user).setDelay(DAY)).to.be.revertedWith("Timelock: caller is not admin");
  });

  it("reverts setDelay below minimum", async function () {
    await expect(timelock.setDelay(0)).to.be.revertedWith("Timelock: delay below minimum");
  });

  it("reverts queue with eta too soon", async function () {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await expect(timelock.queueTransaction(admin.address, 0, "0x", now + 1)).to.be.revertedWith("Timelock: eta too soon");
  });
});
