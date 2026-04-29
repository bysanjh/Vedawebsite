import { HeroSection } from "@/components/hero-section";
import { CarouselOnly } from "@/components/carousel-only";

const cards = [
  {
    id: 1,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Marie-eUwNBpLCLMCYVKp0WfkabM50WHSc0r.jpg",
  },
  {
    id: 2,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ophelia-D3XJxrsoi3e8rBZFDQ1b6iID0fs6zK.jpg",
  },
  {
    id: 3,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Julie-i7hrWj8Wep2X9xDx3Bjdw6ECUBzreZ.jpg",
  },
  {
    id: 4,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Harmony-SktAESXULtA5WV4GHmu5FbpKXDDTFP.jpg",
  },
  {
    id: 5,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AVALON-APaFBKaVii4YkAMqNZXmm5SwLI1m80.jpg",
  },
  {
    id: 6,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Veda-KjRsknLU9Un1PXYA0bbkHk1srdbJSk.jpg",
  },
  {
    id: 7,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Aviva-0u1EiTpd2dpv5eqBJyRUQ2doklXmgS.jpg",
  },
];

export default function Home() {
  return (
    <main>
      {/* Section 1: Hero with starlight iframe background */}
      <HeroSection />

      {/* Section 2: Black advisor carousel */}
      <section
        style={{
          background: "linear-gradient(to bottom, transparent 0%, #000000 18%)",
          height: "100vh",
          position: "relative",
          zIndex: 10,
          marginTop: "-50vh",
        }}
      >
        <CarouselOnly cards={cards} />
      </section>
    </main>
  );
}
