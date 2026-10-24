import { notFound } from "next/navigation";
import { OrbLabClient } from "./orb-lab-client";

export default function OrbLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <OrbLabClient />;
}
