// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleWhitelist is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    bytes32 public merkleRoot;

    modifier onlyWhitelisted(bytes32[] calldata merkleProof) {
        checkValidity(merkleProof);
        _;
    }

    modifier notMinted() {
        require(balanceOf(msg.sender) == 0, "Already minted");
        _;
    }

    constructor() ERC721("MerkleWhitelist", "MWL") {}

    function safeMint(bytes32[] calldata merkleProof)
        public
        onlyWhitelisted(merkleProof)
        notMinted
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    function setMerkleRoot(bytes32 proof) public onlyOwner {
        merkleRoot = proof;
    }

    function checkValidity(bytes32[] calldata merkleProof) public view {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Incorrect proof"
        );
    }
}
