"use client";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { Suspense } from "react";
import SubmitForm from "@/components/submit-form";

function SubmitPageContent() {
  const searchParams = useSearchParams();

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <motion.main
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative"
        style={{
          width: "428px",
          minHeight: "100vh",
          margin: "0 auto",
          backgroundColor: "#E1CAB2",
          border: "4px solid #76583F",
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
          backgroundColor: "#2B7180",
          opacity: 0.84,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
        }}
      >
        <FaArrowLeft
          style={{
            transform: "rotate(0deg)",
            stroke: "#FFFFFF",
            strokeWidth: "6px",
            fontSize: "49px",
            color: "#FFFFFF",
          }}
        />
      </button>

      <h1
        style={{
          position: "absolute",
          top: "25px",
          left: "117px",
          fontSize: "48px",
          fontFamily: "Lalezar, sans-serif",
          color: "#76583F",
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
          color: "#758A48",
        }}
      >
        Review & Submit
      </h2>

      <div 
        style={{
          marginTop: "151px",
          width: "100%",
          paddingBottom: "50px",
        }}
      >
        <SubmitForm searchParams={searchParams} />
      </div>
    </motion.main>
    </>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitPageContent />
    </Suspense>
  );
}
