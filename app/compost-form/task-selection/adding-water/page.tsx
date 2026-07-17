"use client";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { parseFormDataFromURL } from "@/lib/utils";

import BackButton from "@/components/ui/dcci/forms/back-button";
import FormHeading from "@/components/ui/dcci/forms/form-heading";
import AddingWater from "@/components/adding-water";

// 🪣
function AddingWaterContent() {
  const searchParams = useSearchParams();
  const formData = parseFormDataFromURL(searchParams);

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

        <BackButton />
        <FormHeading subHeading="Error" isError={!formData} />
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

        <BackButton />
        <FormHeading subHeading="Add Water" />

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
          <AddingWater searchParams={searchParams} />
        </div>
      </motion.main>
    </>
  );
}

export default function AddingWaterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddingWaterContent />
    </Suspense>
  );
}
