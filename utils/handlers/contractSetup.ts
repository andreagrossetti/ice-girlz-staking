import { contractAdds } from "@/utils/contractAdds";
import frostAbi from "@/utils/abis/frost";
import IGabi from "@/utils/abis/ice-girlz";
import IFabi from "@/utils/abis/ice-folks";
import { ethers } from "ethers";
import stakingAbi from "@/utils/abis/staking";
import raffleAbi from "@/utils/abis/raffles";
import erc721abi from "../abis/erc721abi";
import { getReadProvider, getSignerOrProvider } from "./getSigner";

const add = [contractAdds.frost, contractAdds.iceGirlz, contractAdds.iceFolks, contractAdds.staking, contractAdds.raffles];
const abi = [frostAbi, IGabi, IFabi, stakingAbi, raffleAbi];

// Contract bound to the connected wallet (writes) or to a read-only provider when not connected.
export async function contractSetup(index: number) {
  try {
    return new ethers.Contract(add[index], abi[index], await getSignerOrProvider());
  }
  catch (err) {
    console.log(err);
  }
}

export async function setERC721Contract(address: string) {
  try {
    return new ethers.Contract(address, erc721abi, await getSignerOrProvider());
  }
  catch (err) {
    console.log(err);
  }
}

export async function fetcherContractSetup(index: number) {
  try {
    const provider = getReadProvider();

    const contract = new ethers.Contract(add[index], abi[index], provider);
    return contract;
  } catch (err) {
    console.error("Error setting up fetcher contract:", err);
    return null;
  }
}