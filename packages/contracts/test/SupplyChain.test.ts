import { expect } from "chai";
import { ethers } from "hardhat";

const EventType = {
  Registered: 0,
  Transferred: 1,
  Inspected: 2,
  Certified: 3,
  Delivered: 4,
  Recalled: 5,
};

describe("SupplyChain", function () {
  async function deploySupplyChain() {
    const [owner, manufacturer, distributor, retailer, other] = await ethers.getSigners();

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    return { supplyChain, owner, manufacturer, distributor, retailer, other };
  }

  async function deployWithParticipants() {
    const ctx = await deploySupplyChain();
    await ctx.supplyChain.setParticipant(ctx.manufacturer.address, true);
    await ctx.supplyChain.setParticipant(ctx.distributor.address, true);
    await ctx.supplyChain.setParticipant(ctx.retailer.address, true);
    return ctx;
  }

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      const { supplyChain, owner } = await deploySupplyChain();
      expect(await supplyChain.owner()).to.equal(owner.address);
    });

    it("should make the deployer a participant by default", async function () {
      const { supplyChain, owner } = await deploySupplyChain();
      expect(await supplyChain.isParticipant(owner.address)).to.equal(true);
    });
  });

  describe("Participant management", function () {
    it("should let the owner grant participant rights", async function () {
      const { supplyChain, manufacturer } = await deploySupplyChain();

      expect(await supplyChain.isParticipant(manufacturer.address)).to.equal(false);
      await supplyChain.setParticipant(manufacturer.address, true);
      expect(await supplyChain.isParticipant(manufacturer.address)).to.equal(true);
    });

    it("should reject setParticipant from a non-owner account", async function () {
      const { supplyChain, manufacturer, other } = await deploySupplyChain();

      await expect(supplyChain.connect(other).setParticipant(manufacturer.address, true)).to.be
        .reverted;
    });
  });

  describe("Registering products", function () {
    it("should register a product with the caller as originator and holder", async function () {
      const { supplyChain, manufacturer } = await deployWithParticipants();

      await supplyChain.connect(manufacturer).registerProduct("Widget A", "Factory 1", "Batch #42");

      const product = await supplyChain.getProduct(1);
      expect(product.name).to.equal("Widget A");
      expect(product.originator).to.equal(manufacturer.address);
      expect(product.currentHolder).to.equal(manufacturer.address);
      expect(product.recalled).to.equal(false);
      expect(await supplyChain.totalProducts()).to.equal(1);
    });

    it("should record a Registered checkpoint", async function () {
      const { supplyChain, manufacturer } = await deployWithParticipants();

      await supplyChain.connect(manufacturer).registerProduct("Widget A", "Factory 1", "Batch #42");

      const history = await supplyChain.getHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].eventType).to.equal(EventType.Registered);
      expect(history[0].actor).to.equal(manufacturer.address);
    });

    it("should reject registering from a non-participant", async function () {
      const { supplyChain, other } = await deployWithParticipants();

      await expect(
        supplyChain.connect(other).registerProduct("Widget A", "Factory 1", "")
      ).to.be.revertedWith("SupplyChain: caller is not a participant");
    });
  });

  describe("Custody transfers", function () {
    async function registeredProduct() {
      const ctx = await deployWithParticipants();
      await ctx.supplyChain
        .connect(ctx.manufacturer)
        .registerProduct("Widget A", "Factory 1", "Batch #42");
      return ctx;
    }

    it("should transfer custody from the current holder to another participant", async function () {
      const { supplyChain, manufacturer, distributor } = await registeredProduct();

      await supplyChain
        .connect(manufacturer)
        .transferCustody(1, distributor.address, "Highway 5", "Picked up");

      const product = await supplyChain.getProduct(1);
      expect(product.currentHolder).to.equal(distributor.address);

      const history = await supplyChain.getHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1].eventType).to.equal(EventType.Transferred);
      expect(history[1].from).to.equal(manufacturer.address);
      expect(history[1].to).to.equal(distributor.address);
    });

    it("should reject a transfer from someone who isn't the current holder", async function () {
      const { supplyChain, distributor, retailer } = await registeredProduct();

      await expect(
        supplyChain.connect(distributor).transferCustody(1, retailer.address, "", "")
      ).to.be.revertedWith("SupplyChain: caller does not hold custody");
    });

    it("should reject transferring to a non-participant", async function () {
      const { supplyChain, manufacturer, other } = await registeredProduct();

      await expect(
        supplyChain.connect(manufacturer).transferCustody(1, other.address, "", "")
      ).to.be.revertedWith("SupplyChain: recipient is not a participant");
    });

    it("should reject transferring a non-existent product", async function () {
      const { supplyChain, manufacturer, distributor } = await deployWithParticipants();

      await expect(
        supplyChain.connect(manufacturer).transferCustody(999, distributor.address, "", "")
      ).to.be.revertedWith("SupplyChain: product does not exist");
    });
  });

  describe("Checkpoints", function () {
    async function registeredProduct() {
      const ctx = await deployWithParticipants();
      await ctx.supplyChain
        .connect(ctx.manufacturer)
        .registerProduct("Widget A", "Factory 1", "Batch #42");
      return ctx;
    }

    it("should record an inspection checkpoint without changing custody", async function () {
      const { supplyChain, manufacturer, distributor } = await registeredProduct();

      await supplyChain
        .connect(distributor)
        .recordCheckpoint(1, EventType.Inspected, "Warehouse 2", "Passed QA");

      const product = await supplyChain.getProduct(1);
      expect(product.currentHolder).to.equal(manufacturer.address);

      const history = await supplyChain.getHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1].eventType).to.equal(EventType.Inspected);
    });

    it("should reject a Registered or Transferred event type via recordCheckpoint", async function () {
      const { supplyChain, manufacturer } = await registeredProduct();

      await expect(
        supplyChain.connect(manufacturer).recordCheckpoint(1, EventType.Registered, "", "")
      ).to.be.revertedWith("SupplyChain: invalid checkpoint type");
    });

    it("should reject checkpoints from a non-participant", async function () {
      const { supplyChain, other } = await registeredProduct();

      await expect(
        supplyChain.connect(other).recordCheckpoint(1, EventType.Inspected, "", "")
      ).to.be.revertedWith("SupplyChain: caller is not a participant");
    });
  });

  describe("Recall", function () {
    async function registeredProduct() {
      const ctx = await deployWithParticipants();
      await ctx.supplyChain
        .connect(ctx.manufacturer)
        .registerProduct("Widget A", "Factory 1", "Batch #42");
      return ctx;
    }

    it("should let the owner recall a product", async function () {
      const { supplyChain } = await registeredProduct();

      await supplyChain.recall(1, "Contamination found");

      const product = await supplyChain.getProduct(1);
      expect(product.recalled).to.equal(true);

      const history = await supplyChain.getHistory(1);
      expect(history[history.length - 1].eventType).to.equal(EventType.Recalled);
    });

    it("should reject a transfer on a recalled product", async function () {
      const { supplyChain, manufacturer, distributor } = await registeredProduct();

      await supplyChain.recall(1, "Contamination found");

      await expect(
        supplyChain.connect(manufacturer).transferCustody(1, distributor.address, "", "")
      ).to.be.revertedWith("SupplyChain: product recalled");
    });

    it("should reject recall from a non-owner", async function () {
      const { supplyChain, manufacturer } = await registeredProduct();

      await expect(supplyChain.connect(manufacturer).recall(1, "x")).to.be.reverted;
    });
  });

  describe("Pause", function () {
    it("should pause registration", async function () {
      const { supplyChain, manufacturer } = await deployWithParticipants();

      await supplyChain.pause();

      await expect(
        supplyChain.connect(manufacturer).registerProduct("Widget A", "Factory 1", "")
      ).to.be.reverted;
    });

    it("should allow registration after unpausing", async function () {
      const { supplyChain, manufacturer } = await deployWithParticipants();

      await supplyChain.pause();
      await supplyChain.unpause();

      await supplyChain.connect(manufacturer).registerProduct("Widget A", "Factory 1", "");

      expect(await supplyChain.totalProducts()).to.equal(1);
    });
  });
});
