import { useRef } from "react";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AllergyProfiles from "@/components/AllergyProfiles";
import MultiModalDetection from "@/components/MultiModalDetection";
import HistorySection from "@/components/HistorySection";
import AllergensReference from "@/components/AllergensReference";
import MethodologySection from "@/components/MethodologySection";
import Footer from "@/components/Footer";

const Index = () => {
  const detectionRef = useRef<HTMLDivElement>(null);

  const scrollToDetection = () => {
    detectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection onGetStarted={scrollToDetection} />
      <AllergyProfiles />
      <div ref={detectionRef}>
        <MultiModalDetection />
      </div>
      <HistorySection />
      <AllergensReference />
      <MethodologySection />
      <Footer />
    </div>
  );
};

export default Index;
