"use client";

/**
 * The '<-' (Back) button
 */

import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={ () => router.back() }
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
  );
}
