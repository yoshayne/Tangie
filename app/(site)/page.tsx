import { DarkFeature } from "@/components/sections/DarkFeature";
import { EventCards } from "@/components/sections/EventCards";
import { FeatureBook } from "@/components/sections/FeatureBook";
import { HeroSplit } from "@/components/sections/HeroSplit";
import { ImageText } from "@/components/sections/ImageText";
import { Newsletter } from "@/components/sections/Newsletter";
import { PostCards } from "@/components/sections/PostCards";
import {
  events,
  featuredBook,
  filmTheater,
  hero,
  journal,
  meetTangie,
  newsletter,
  speaking,
} from "@/lib/home-data";

export default function Home() {
  return (
    <>
      <HeroSplit {...hero} />
      <FeatureBook {...featuredBook} />
      <ImageText {...meetTangie} />
      <DarkFeature {...filmTheater} />
      <ImageText {...speaking} />
      <EventCards {...events} />
      <PostCards {...journal} />
      <Newsletter {...newsletter} />
    </>
  );
}
