// SPDX-License-Identifier: MIT
// Made by 3xBuilds (https://linktr.ee/3xbuilds)
// Reach out on Discord at Needle#5483 or on X(Twitter) at @degeneer03

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFROST{
    function transferFrom(address from, address to, uint256 amount) external;
}

interface INft{
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

struct returnRaffle{
    address contractAdd;
    uint256 tokenId;
    uint256 endTime;
    uint256 participants;
    uint256 sold;
    uint256 maxAllowed;
    uint256 owned;
    uint256 maxOwnAllowed;
    uint256 frostPrice;
    string collectionLink;
    walletHoldings[] holders;
}

struct walletHoldings{
    address wallet;
    uint256 tickets;
}

struct endedRaffle{
    address contractAdd;
    uint256 tokenId;
    address winner;
}

struct userTicket {
    address contractAdd;
    uint256 tokenId;
    uint256 holding;
}

contract IceRaffle is Ownable{

    IFROST public frost;
    INft public nftToTransfer;

    uint256 public activeRaffles;
    uint256 public endedRaffles;
    uint256 public endRaffleIndex;

    address public fundReceiver;

    function setFundReceiver(address newReceiver) public onlyOwner {
        fundReceiver = newReceiver;
    }

    mapping(uint256 => uint256) public ticketLimit;
    mapping(uint256 => uint256) public ticketLimitPerWallet;
    mapping(uint256 => uint256) public ticketsSold;
    mapping(uint256 => uint256) public raffleTokenId;
    mapping(uint256 => address) public raffleContract;
    mapping(uint256 => mapping(address => uint256)) public walletHolding;
    mapping(uint256 => mapping(uint256 => address)) public enteredWallet;
    mapping(uint256 => string) public collectionLink;
    mapping(uint256 => uint256) public raffleEntryFrostCost;
    mapping(uint256 => uint256) public totalEntrants;
    mapping(uint256 => address) public lastNftWonContract;
    mapping(uint256 => uint256) public lastNftWonTokenId;
    mapping(uint256 => address) public lastWinners;
    mapping(uint256 => uint256) public endTimeStore;

    uint256 public randNonce = 0;

    constructor(address owner) Ownable(owner){
        frost = IFROST(0xEd06Bb12A7BAeF7aa6572535bE7f205872B78531);
    }

    function getUsersTickets(address user) public view returns(userTicket[] memory){

        userTicket[] memory dataArr = new userTicket[](activeRaffles);

        for(uint256 i = 0; i< activeRaffles; i++){
            dataArr[i] = userTicket(raffleContract[i], raffleTokenId[i], walletHolding[i][user]);
        }

        return dataArr;
    }

    function deleteRaffle(uint256 raffleIndex) public onlyOwner{

            for(uint256 i = raffleIndex; i<=activeRaffles;i++){
                ticketLimit[i] = ticketLimit[i+1];
                ticketLimitPerWallet[i] = ticketLimitPerWallet[i+1];
                ticketsSold[i] = ticketsSold[i+1];
                raffleTokenId[i] = raffleTokenId[i+1];
                raffleContract[i] = raffleContract[i+1];
                collectionLink[i] = collectionLink[i+1];
                raffleEntryFrostCost[i] = raffleEntryFrostCost[i+1];
                
                for(uint256 j = 0; j<totalEntrants[i]; j++){
                    walletHolding[i][enteredWallet[i][j]] = 0;
                    enteredWallet[i][j] = address(0);
                }

                totalEntrants[i] = totalEntrants[i+1];
                
                for(uint256 k = 0; k<totalEntrants[i+1]; k++){
                    walletHolding[i][enteredWallet[i+1][k]] = walletHolding[i+1][enteredWallet[i+1][k]];                   
                    enteredWallet[i][k] = enteredWallet[i+1][k];
                } 
                
            }

            activeRaffles--;
    }

    function fetchActiveRaffles() public view returns (returnRaffle[] memory){
        returnRaffle[] memory dataArr = new returnRaffle[](activeRaffles);

        for(uint256 i = 0; i < activeRaffles; i++){
            walletHoldings[] memory arr = new walletHoldings[](totalEntrants[i]);

            for(uint256 j = 0; j<totalEntrants[i]; j++){
                address holder = enteredWallet[i][j];
                arr[j] = walletHoldings(holder, walletHolding[i][holder]);
            }

            dataArr[i] = returnRaffle(raffleContract[i], raffleTokenId[i], endTimeStore[i],  totalEntrants[i], ticketsSold[i], ticketLimit[i], walletHolding[i][msg.sender], ticketLimitPerWallet[i], raffleEntryFrostCost[i], collectionLink[i], arr);
        }

        return dataArr;
    }

    function fetchEndedRaffles() public view returns (endedRaffle[] memory){
        endedRaffle[] memory dataArr = new endedRaffle[](10);

        for(uint256 i = 0; i<10; i++){
            dataArr[i] = endedRaffle(lastNftWonContract[i], lastNftWonTokenId[i], lastWinners[i]);
        }

        return dataArr;
    }

    function setRaffleItem(uint256 raffleIndex, address contractAddress, uint256 limitPerWallet, string memory link, uint256 tokenId, uint256 tickets, uint256 frostCost, uint256 endTime) public onlyOwner{
       
        raffleContract[raffleIndex] = contractAddress;
        raffleTokenId[raffleIndex] = tokenId;
        ticketLimit[raffleIndex] = tickets;
        collectionLink[raffleIndex] = link;
        ticketLimitPerWallet[raffleIndex] = limitPerWallet;
        raffleEntryFrostCost[raffleIndex] = frostCost;
        endTimeStore[raffleIndex] = endTime;

        activeRaffles++;
    }

    function enterFrostRaffle(uint256 raffleIndex, uint256 tickets) public {
        if(ticketLimit[raffleIndex] > 0)
        require(ticketLimit[raffleIndex] >= ticketsSold[raffleIndex] + tickets, "Exceeding total tickets");

        if(ticketLimitPerWallet[raffleIndex] > 0)
        require(walletHolding[raffleIndex][msg.sender] + tickets <= ticketLimitPerWallet[raffleIndex], "Exceeding per wallet limit");

        require(endTimeStore[raffleIndex] > block.timestamp, "Sorry, the raffle has ended!");

        ticketsSold[raffleIndex] = ticketsSold[raffleIndex] + tickets;

        if(walletHolding[raffleIndex][msg.sender] == 0){
            enteredWallet[raffleIndex][totalEntrants[raffleIndex]] = msg.sender;
            totalEntrants[raffleIndex] = totalEntrants[raffleIndex] +1;
        }

        walletHolding[raffleIndex][msg.sender] = walletHolding[raffleIndex][msg.sender] + tickets;
        
        uint256 cost = tickets*raffleEntryFrostCost[raffleIndex];
        frost.transferFrom(msg.sender, fundReceiver, cost);
    }


    function chooseWinner(uint256 raffleIndex) public view returns(address) {
    uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % ticketsSold[raffleIndex];
    
    uint256 runningTotal = 0;
    
    for(uint256 i = 0; i < totalEntrants[raffleIndex]; i++) {
        address participant = enteredWallet[raffleIndex][i];
        runningTotal += walletHolding[raffleIndex][participant];
        
        if(randomNumber < runningTotal) {
            return participant;
        }
    }
    
    // Fallback (should never reach here if logic is correct)
    return enteredWallet[raffleIndex][0];
}

function declareWinner(uint256 raffleIndex) public onlyOwner{
    randNonce++;
    address winningWallet = chooseWinner(raffleIndex);
    
    nftToTransfer = INft(raffleContract[raffleIndex]);
    nftToTransfer.safeTransferFrom(msg.sender , winningWallet, raffleTokenId[raffleIndex]);

    lastWinners[endRaffleIndex] = winningWallet;
    lastNftWonTokenId[endRaffleIndex] = raffleTokenId[raffleIndex];
    lastNftWonContract[endRaffleIndex] = raffleContract[raffleIndex];
    endedRaffles++;

    if(endRaffleIndex != 9){
        endRaffleIndex++;
    }
    else{
        endRaffleIndex = 0;
    }
    
    deleteRaffle(raffleIndex);
}

}