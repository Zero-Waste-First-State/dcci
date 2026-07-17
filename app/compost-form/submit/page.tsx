"use client";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

import BackButton from "@/components/ui/dcci/forms/back-button";
import FormHeading from "@/components/ui/dcci/forms/form-heading";
import SubmitForm from "@/components/submit-form";

function SubmitPageContent() {
  const searchParams = useSearchParams();

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
        <BackButton />
        <FormHeading subHeading="Review & Submit" />

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
