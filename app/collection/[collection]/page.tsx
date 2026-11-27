import { StakeHolder } from "@/components/staking/stakeHolder";
import Background from "@/components/UI/background";
import Navbar from "@/components/UI/navbar";
import { notFound } from "next/navigation";

const COLLECTIONS = ["ice-girlz", "ice-folks"];

export default async function Home({params}:{params: Promise<{collection:string}>}) {
  const { collection } = await params;
  if (!COLLECTIONS.includes(collection.toLowerCase())) notFound();

  return (
    <div className="max-h-screen overflow-hidden">
      <Background/>
      <Navbar/>
      {/* @ts-ignore */}
      <StakeHolder collection={collection.toLowerCase()} />
    </div>
  );
}
