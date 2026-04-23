"use client";

import dynamic from "next/dynamic";

const HomeHero3D = dynamic(
  () => import("./HomeHero3D").then((m) => m.HomeHero3D),
  { ssr: false, loading: () => <div className="home-hero-3d-loading" /> }
);

export default function HomeHero3DClient() {
  return <HomeHero3D />;
}
