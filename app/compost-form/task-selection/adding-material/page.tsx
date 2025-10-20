"use client";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { Suspense } from "react";
import AddingMaterial from "@/components/adding-material";
import { parseFormDataFromURL } from "@/lib/utils";

function AddingMaterialContent() {
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
          minHeight: "1132px",
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
            backgroundColor: "#2B7180",   // earthyGreen
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
    <>
      <style jsx>{`
        .scrollable-content::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <motion.main
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative"
        style={{
          width: "428px",
          minHeight: "1132px",
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
          backgroundColor: "#2B7180", // earthyGreen
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
          color: "#758A48", // earthyGreen
        }}
      >
        Add Material
      </h2>

      <div 
        className="scrollable-content"
        style={{ 
          position: "absolute", 
          top: "150px", 
          left: "0px", 
          width: "100%", 
          padding: "0 24px",
          maxHeight: "calc(100% - 150px)",
          overflowY: "auto",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}>
        <AddingMaterial searchParams={searchParams} />
      </div>
    </motion.main>
    </>
  );
}

export default function AddingMaterialPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddingMaterialContent />
    </Suspense>
  );
}

