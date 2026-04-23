"use client";

import Link from "next/link";
import { ArtifactStack } from "./ArtifactStack";

export type RoomCard = {
  slug: string;
  decade: string;
  maker: string;
  name: string;
  tagline: string;
  artifacts: [string, string, string]; // three image paths
  roomNumber: string;
};

export function FourRoomsShowcase({ rooms }: { rooms: RoomCard[] }) {
  return (
    <section className="four-rooms">
      <div className="four-rooms-header">
        <p className="eyebrow">Featured Specimens</p>
        <h2 className="serif-display four-rooms-title">
          Four rooms. <em className="text-[color:var(--color-brass-dark)]">Forty years of evidence.</em>
        </h2>
        <p className="four-rooms-sub">
          Period magazine scans, engineering cutaways, press-launch photographs,
          and auction catalogues, collected from the primary written source of
          each gallery.
        </p>
      </div>

      <div className="four-rooms-grid">
        {rooms.map((room) => (
          <Link key={room.slug} href={`/${room.slug}`} className="room-card group">
            <div className="room-header">
              <span className="room-number">{room.roomNumber}</span>
              <span className="room-decade">{room.decade}</span>
            </div>

            <div className="room-stack-wrap">
              <ArtifactStack
                leftImage={room.artifacts[0]}
                middleImage={room.artifacts[1]}
                rightImage={room.artifacts[2]}
                size="md"
              />
            </div>

            <div className="room-title">
              <span className="room-maker">{room.maker}</span>
              <span className="room-name">{room.name}</span>
            </div>
            <p className="room-tagline">{room.tagline}</p>
            <span className="room-enter">
              Enter the room <span className="room-arrow">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
