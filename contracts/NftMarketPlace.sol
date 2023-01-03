// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

// Imports 
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Errors
error NftMarketPlace__PriceMustBeAboveZero();
error NftMarketPlace__NotApprovedForMarketPlace();
error NftMarketPlace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__NotOwner();
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketPlace__NoProceeds();


contract NftMarketPlace is ReentrancyGuard{
    
    struct Listing {
        uint256 price;
        address seller;
    }

    // Events
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price 
    );
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price 
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    // Mappings
    // NFT Contract address --> NFT TokenId --> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    // Modifiers
    modifier notListed (address nftAddress, uint256 tokenId, address owner) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner (address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketPlace__NotOwner();
        }
        _;
    }

    modifier isListed (address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(listing.price <= 0) {
            revert NftMarketPlace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    // Functions
    function listItem (address nftAddress, uint256 tokenId, uint256 price)
        external notListed(nftAddress, tokenId, msg.sender)
        isOwner (nftAddress, tokenId, msg.sender) 
    {
        if (price <= 0) {         
             revert NftMarketPlace__PriceMustBeAboveZero();
                }
// We have two ways:
// 1. We can send the NFT to the contract. Transfer --> Contract "hold" the NFT.
// 2. Owner can still hold the NFT and give the marketplace approval to sell the NFT for them.

        IERC721 nft = IERC721(nftAddress);
        if(nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NotApprovedForMarketPlace();
              }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender); 
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem (address nftAddress, uint256 tokenId) external payable nonReentrant isListed (nftAddress, tokenId) {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if(msg.value < listedItem.price) {
            revert NftMarketPlace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        s_proceeds[listedItem.seller] += msg.value;       
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);   // We have put the transfer function at last to prevent reentancy attack.
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice)external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
         if (newPrice <= 0) {
            revert NftMarketPlace__PriceMustBeAboveZero();
        }
        s_listings[nftAddress][tokenId].price = newPrice ;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if(proceeds <= 0) {
            revert NftMarketPlace__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require (success, "Transfer Failed");
    }

    // Getter Functions
    function getListing(address nftAddress, uint256 tokenId) external view returns(Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns(uint256) {
        return s_proceeds[seller];
    }

}