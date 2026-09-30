import Loader from "./components/Loader.jsx";
import ChipScene from "./components/ChipScene.jsx";
import Frame from "./components/Frame.jsx";
import TopBar from "./components/TopBar.jsx";
import HUD from "./components/HUD.jsx";
import SideIndex from "./components/SideIndex.jsx";
import Marquee from "./components/Marquee.jsx";
import Footer from "./components/Footer.jsx";

import Hero from "./sections/Hero.jsx";
import Anatomy from "./sections/Anatomy.jsx";
import Spec from "./sections/Spec.jsx";
import Experience from "./sections/Experience.jsx";
import Work from "./sections/Work.jsx";
import Publications from "./sections/Publications.jsx";
import Recognition from "./sections/Recognition.jsx";
import Contact from "./sections/Contact.jsx";

export default function App() {
  return (
    <>
      <Loader />
      <ChipScene />
      <Frame />
      <TopBar />
      <HUD />
      <SideIndex />

      <main>
        <Hero />
        <Marquee />
        <Anatomy />
        <Spec />
        <Experience />
        <Work />
        <Publications />
        <Recognition />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
