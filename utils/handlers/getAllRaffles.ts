import { ethers } from "ethers";
import { contractSetup } from "./contractSetup"

export async function getAllRaffles(){
    try{
        const contract = await contractSetup(4);
        const raffles = await contract?.fetchActiveRaffles()

        const newRaffles = raffles.map((raffle: any, i:number) => {
            return {
                index: i,
                contractAddress: raffle.contractAdd,
                frostPrice: Number(ethers.utils.formatEther(raffle.frostPrice)),
                maxAllowed: Number(raffle.maxAllowed),
                maxOwnAllowed: Number(raffle.maxOwnAllowed),
                sold: Number(raffle.sold),
                tokenId: Number(raffle.tokenId),
                opensea: raffle.collectionLink,
                endTime: Number(raffle.endTime),
                holders: raffle.holders,
                holding: Number(raffle.owned)
            };
        });

        return newRaffles;
    }
    catch(err){
        console.log(err)
    }
}

export async function getEndedRaffles(){

try{
        const contract = await contractSetup(4);
        const ended = await contract?.fetchEndedRaffles()

        const endedRaffles = ended.map((raffle: any, i:number) => {
            return {
                contractAddress: raffle.contractAdd,
                tokenId: Number(raffle.tokenId),
                winner: raffle.winner,
            };
        });

        return endedRaffles;
    }
    catch(err){
        console.log(err)
    }
}

export async function yourTickets(user: `0x${string}`){
    try{
        const contract = await contractSetup(4);
        const tickets = await contract?.getUsersTickets(user);

        const newTickets = tickets.map((ticket: any, i:number) => {
            return {
                index: i,
                contractAddress: ticket.contractAdd,
                tokenId: Number(ticket.tokenId),
                tickets: Number(ticket.holding),
            };
        });

        return newTickets;
    }
    catch(err){
        console.log(err)
    }

}
