import Head from 'next/head';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CardGrid from '../components/CardGrid';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>Carta Suelta — Cartas Pokémon TCG</title>
        <meta name="description" content="Compra y vende cartas Pokémon TCG. La tienda más confiable de LATAM." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </Head>

      <Navbar />
      <main>
        <HeroSection />
        <CardGrid />
      </main>
      <Footer />
    </>
  );
}
