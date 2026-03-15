import { PLANT_DATA } from "@/data/plants";
import { notFound } from "next/navigation";
import PlantDetail from "./PlantDetail";

// Note the 'async' and the 'await params'
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // You must await params now!
    const plant = PLANT_DATA[id];

    if (!plant) {
        console.log(`Plant ID "${id}" not found in PLANT_DATA`);
        notFound();
    }

    return <PlantDetail plant={plant} />;
}
