"use client";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { Suspense } from "react";
import MeasuringBin from "@/components/measuring-bin";
import { parseFormDataFromURL } from "@/lib/utils";

function MeasuringBinContent() {
  const searchParams = useSearchParams();
  const formData = parseFormDataFromURL(searchParams);

  const handleBack = () => {
    window.history.back();
  };

  if (!formData) {
    return (
      <motion.main
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative"
        style={{
          width: "428px",
          height: "1132px",
          margin: "0 auto",
          backgroundColor: "#E1CAB2", // earthyTan
          border: "4px solid #76583F", // earthyBrown
          borderRadius: "21px",
          padding: "24px",
          fontFamily: "PT Sans, sans-serif",
        }}
      >
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            position: "absolute",
            top: "35px",
            left: "16px",
            width: "78px",
            height: "78px",
            borderRadius: "50%",
            backgroundColor: "#2B7180", // earthyBlue
            opacity: 0.84,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
          }}
        >
          <FaArrowLeft style={{ fontSize: "49px", color: "#FFFFFF" }} />
        </button>

        <h1
          style={{
            position: "absolute",
            top: "25px",
            left: "117px",
            fontSize: "48px",
            fontFamily: "Lalezar, sans-serif",
            color: "#76583F", // earthyBrown
          }}
        >
          Compost Log:
        </h1>

        <h2
          style={{
            position: "absolute",
            top: "72px",
            left: "117px",
            fontSize: "36px",
            fontFamily: "Lalezar, sans-serif",
            color: "#8F8F8F", // grayText
          }}
        >
          Error
        </h2>

        <p
          style={{
            position: "absolute",
            top: "151px",
            left: "26px",
            fontSize: "24px",
            color: "#8F8F8F", // grayText
            textAlign: "center",
            width: "396px",
          }}
        >
          Missing required form data. Please go back and start over.
        </p>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="relative"
      style={{
        width: "428px",
        margin: "0 auto",
        backgroundColor: "#E1CAB2", // earthyTan
        border: "4px solid #76583F", // earthyBrown
        borderRadius: "21px",
        padding: "24px",
        fontFamily: "PT Sans, sans-serif",
        overscrollBehavior: "contain",
        overscrollBehaviorY: "contain",
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        style={{
          position: "absolute",
          top: "35px",
          left: "16px",
          width: "78px",
          height: "78px",
          borderRadius: "50%",
          backgroundColor: "#2B7180", // earthyBlue
          opacity: 0.84,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
        }}
      >
        <FaArrowLeft style={{ fontSize: "49px", color: "#FFFFFF" }} />
      </button>

      <h1
        style={{
          position: "absolute",
          top: "25px",
          left: "117px",
          fontSize: "48px",
          fontFamily: "Lalezar, sans-serif",
          color: "#76583F", // earthyBrown,
        }}
      >
        Compost Log:
      </h1>

      <h2
        style={{
          position: "absolute",
          top: "72px",
          left: "117px",
          fontSize: "36px",
          fontFamily: "Lalezar, sans-serif",
          color: "#758A48", // earthyGreen
        }}
      >
        Measure Bin
      </h2>

      <div 
        style={{
          marginTop: "150px",
          width: "100%",
        }}
      >
        <MeasuringBin searchParams={searchParams} />
      </div>
    </motion.main>
  );
}

export default function MeasuringBinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MeasuringBinContent />
    </Suspense>
  );
}
