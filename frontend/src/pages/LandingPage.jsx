import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import NetworkBackground from "../components/NetworkBackground";


export default function LandingPage() {

  return (

    <div className="app landing-page">

      <div className="blue-glow glow-one" />

      <div className="red-glow glow-two" />

      <NetworkBackground />

      <Navbar />

      <Hero />

    </div>

  );
}