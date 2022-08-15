import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("MerkleWhitelistTests", function () {
  async function setTestSatate() {
    const MerkleWhitelist = await ethers.getContractFactory("MerkleWhitelist");
    const merkleWhitelist = await MerkleWhitelist.deploy();
    
    const signers = await ethers.getSigners();
    const tree =  createMerkleTree((signers.map((x) => x.address)))

    await merkleWhitelist.setMerkleRoot(tree.getRoot())
    return { signers, merkleWhitelist, tree};
  }

  it("Should contain an address which is in the whitelist", async function () {
    const { signers, merkleWhitelist, tree} = await loadFixture(setTestSatate);
    const proof = tree.getHexProof(keccak256(signers[1].address))
    await expect(merkleWhitelist.connect(signers[1]).checkValidity(proof)).not.to.be.reverted;
  });

  it("Should not contain an address which is not in the whitelist", async function () {
    const { signers, merkleWhitelist, tree} = await loadFixture(setTestSatate);
    const proof = tree.getHexProof(keccak256("0x48b23E9EF1D5E501a8dB99275675B2A3DA82be1C"))
    await expect(merkleWhitelist.connect(signers[1]).checkValidity(proof)).to.be.revertedWith(
        "Incorrect proof"
      );
  });

  it("Should mint if the address is in the whitelist and not minted before", async function () {
    const { signers, merkleWhitelist, tree} = await loadFixture(setTestSatate);
    const proof = tree.getHexProof(keccak256(signers[1].address))
    await expect(merkleWhitelist.connect(signers[1]).safeMint(proof)).not.to.be.reverted;
    expect(await merkleWhitelist.connect(signers[1]).balanceOf(signers[1].address)).to.be.equal(1);
  });

  it("Should not mint if the address already minted", async function () {
    const { signers, merkleWhitelist, tree} = await loadFixture(setTestSatate);
    const proof = tree.getHexProof(keccak256(signers[1].address))
    await expect(merkleWhitelist.connect(signers[1]).safeMint(proof)).not.to.be.reverted;
    await expect(merkleWhitelist.connect(signers[1]).safeMint(proof)).to.be.revertedWith(
        "Already minted"
      );
  });


});

function createMerkleTree(addresses: string[]): MerkleTree {
    const leaves = addresses.map(addr => keccak256(addr))
    return new MerkleTree(leaves, keccak256, {sortPairs: true})
}
