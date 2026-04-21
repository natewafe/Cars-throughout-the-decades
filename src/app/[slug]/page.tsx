import { notFound } from "next/navigation";
import { cars, carsBySlug } from "@/lib/cars";
import { CarExhibit } from "@/components/CarExhibit";

export function generateStaticParams() {
  return cars.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = carsBySlug[slug];
  if (!car) return {};
  return {
    title: `${car.maker} ${car.name} — The Motor Gallery`,
    description: car.tagline,
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = carsBySlug[slug];
  if (!car) notFound();

  const idx = cars.findIndex((c) => c.slug === slug);
  const next = cars[(idx + 1) % cars.length];

  return <CarExhibit car={car} next={next.slug === car.slug ? undefined : next} />;
}
