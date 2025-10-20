"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";

import { FaArrowRight } from "react-icons/fa";

interface LitterPageProps {
  searchParams: URLSearchParams;
}

interface LitterData {
    contamination: boolean | null; // null = not answered yet
    bin1Contam: boolean;
    bin2Contam: boolean;
    bin3Contam: boolean;
    bin4Contam: boolean;
    plasticTrash: boolean;
    foodStickers: boolean;
    prohibitedOr: boolean;
    otherTrash: boolean;
    otherTrashText: string;
    contaminationRemoved: boolean | null; // null = not answered yet
}

export default function LitterPage({ searchParams }: LitterPageProps) {
    const [formData, setFormData] = useState<FormData | null>(null);
    const [litterData, setLitterData] = useState<LitterData>({
        contamination: null,
        bin1Contam: false,
        bin2Contam: false,
        bin3Contam: false,
        bin4Contam: false,
        plasticTrash: false,
        foodStickers: false,
        prohibitedOr: false,
        otherTrash: false,
        otherTrashText: "",
        contaminationRemoved: null
    });
    const [message, setMessage] = useState("");
    const router = useRouter();

    useEffect(() => {
        console.log("Litter Page mounted, searchParams:", searchParams.toString());
        const data = parseFormDataFromURL(searchParams);
        if (!data) {
            setMessage("Error: Missing form data. Please start over.");
            return;
        }
        console.log("Parsed form data:", data);
        setFormData(data);

        // Check if user is coming from issue corner (wanting to correct contamination assessment)
        const referrer = document.referrer;
        const isComingFromIssueCorner = referrer.includes('/issue-corner');
        
        // Load saved litter data from localStorage
        const savedLitterData = localStorage.getItem(`litter_${data.submissionId}`);
        if (savedLitterData) {
            try {
                const loadedData = JSON.parse(savedLitterData);
                console.log("Loaded saved litter data:", loadedData);
                
                // If coming from issue corner, always start with initial question
                if (isComingFromIssueCorner) {
                    setLitterData(prev => ({ 
                        ...prev, 
                        ...loadedData,
                        contamination: null // Reset to initial question
                    }));
                } else {
                    setLitterData(prev => ({ ...prev, ...loadedData }));
                }
            } catch (error) {
                console.error("Error loading saved litter data:", error);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (formData) {
            console.log("Saving litter data to localStorage:", litterData);
            localStorage.setItem(`litter_${formData.submissionId}`, JSON.stringify(litterData));
        }
    }, [formData, litterData]);

    const handleInitialResponse = (contamination: boolean) => {
        setLitterData(prev => ({ 
            ...prev, 
            contamination,
            // Reset all detailed form data when switching contamination response
            bin1Contam: false,
            bin2Contam: false,
            bin3Contam: false,
            bin4Contam: false,
            plasticTrash: false,
            foodStickers: false,
            prohibitedOr: false,
            otherTrash: false,
            otherTrashText: "",
            contaminationRemoved: null
        }));
        setMessage("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData) {
            setMessage("Error: Missing form data. Please start over.");
            return;
        }

        // If no contamination was found, proceed directly to issue corner
        if (litterData.contamination === false) {
            router.push(`/compost-form/issue-corner?${searchParams.toString()}`);
            return;
        }

        // If contamination was found, validate the detailed form
        if (litterData.contamination === true) {
            // Validate that at least one bin is selected
            const hasBinSelection = litterData.bin1Contam || litterData.bin2Contam || litterData.bin3Contam || litterData.bin4Contam;

            if (!hasBinSelection) {
                setMessage("Please select at least one bin that had contamination.");
                return;
            }

            // Validate that at least one contamination type is selected
            const hasContaminationType = litterData.plasticTrash || litterData.foodStickers || litterData.prohibitedOr || litterData.otherTrash;

            if (!hasContaminationType) {
                setMessage("Please select at least one type of contamination observed.");
                return;
            }

            // Validate that contamination removal question is answered
            if (litterData.contaminationRemoved === null) {
                setMessage("Please indicate whether you removed and disposed of the contamination.");
                return;
            }

            // Validate that if "Other trash" is selected, text is provided
            if (litterData.otherTrash && !litterData.otherTrashText.trim()) {
                setMessage("Please describe the other contamination type.");
                return;
            }
        }

        setMessage("");
        // Navigate to issue corner
        router.push(`/compost-form/issue-corner?${searchParams.toString()}`);
    };

    const updateLitterData = (field: keyof LitterData, value: boolean | string) => {
        console.log(`Updating ${field} to: ${value}`);
        setLitterData(prev => ({ ...prev, [field]: value }));
        setMessage("");
    };

    const isFormValid = () => {
        // If no contamination, always valid
        if (litterData.contamination === false) {
            return true;
        }
        
        // If contamination found, validate all required fields
        if (litterData.contamination === true) {
            const hasBinSelection = litterData.bin1Contam || litterData.bin2Contam || litterData.bin3Contam || litterData.bin4Contam;
            const hasContaminationType = litterData.plasticTrash || litterData.foodStickers || litterData.prohibitedOr || litterData.otherTrash;
            const hasRemovalAnswer = litterData.contaminationRemoved !== null;
            const hasOtherText = !litterData.otherTrash || litterData.otherTrashText.trim();
            
            return hasBinSelection && hasContaminationType && hasRemovalAnswer && hasOtherText;
        }
        
        return false;
    };
    


    if (!formData) {
        return (
            <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "#FB3939", fontFamily: "PT Sans, sans-serif" }}>{message}</p>
            </div>
        );
    }

    return (
        <div style={{ width: "100%" }}>
            <form onSubmit={handleSubmit}>
                {/* Initial Contamination Question */}
                <div style={{ marginBottom: "30px" }}>
                    <h3
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            marginBottom: "20px",
                            fontFamily: "PT Sans, sans-serif",
                            color: "#758A48",
                        }}
                    >
                        Did you observe contamination in the bins today?
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <button
                            type="button"
                            onClick={() => handleInitialResponse(true)}
                            style={{
                                width: "100%",
                                height: "57px",
                                borderRadius: "16px",
                                backgroundColor: litterData.contamination === true ? "#758A48" : "#FFFFFF",
                                border: "1px solid #758A48",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                fontSize: "20px",
                                fontWeight: "bold",
                                fontFamily: "PT Sans, sans-serif",
                                color: litterData.contamination === true ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            Contamination found
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => handleInitialResponse(false)}
                            style={{
                                width: "100%",
                                height: "57px",
                                borderRadius: "16px",
                                backgroundColor: litterData.contamination === false ? "#758A48" : "#FFFFFF",
                                border: "1px solid #758A48",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                fontSize: "20px",
                                fontWeight: "bold",
                                fontFamily: "PT Sans, sans-serif",
                                color: litterData.contamination === false ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            No contamination found
                        </button>
                    </div>
                </div>

                {/* Dynamic Detailed Form - Only shown if contamination is true */}
                {litterData.contamination === true && (
                    <>
                        {/* Which bins had contamination */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    marginBottom: "20px",
                                    fontFamily: "PT Sans, sans-serif",
                                    color: "#758A48", 
                                }}
                            >
                                Which bins had contamination?
                            </h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <button
                                    type="button"
                                    onClick={() => updateLitterData('bin1Contam', !litterData.bin1Contam)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.bin1Contam ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.bin1Contam ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Bin 1
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateLitterData('bin2Contam', !litterData.bin2Contam)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.bin2Contam ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.bin2Contam ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Bin 2
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateLitterData('bin3Contam', !litterData.bin3Contam)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.bin3Contam ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.bin3Contam ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Bin 3
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateLitterData('bin4Contam', !litterData.bin4Contam)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.bin4Contam ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.bin4Contam ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Bin 4
                                </button>
                            </div>
                        </div>

                        {/* What type of contamination */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    marginBottom: "20px",
                                    fontFamily: "PT Sans, sans-serif",
                                    color: "#758A48",
                                }}
                            >
                                What type of contamination was observed?
                            </h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <button
                                    type="button"
                                    onClick={() => updateLitterData('plasticTrash', !litterData.plasticTrash)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.plasticTrash ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.plasticTrash ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Plastic trash
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateLitterData('foodStickers', !litterData.foodStickers)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.foodStickers ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.foodStickers ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Food stickers
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateLitterData('prohibitedOr', !litterData.prohibitedOr)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.prohibitedOr ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.prohibitedOr ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Prohibited organics (meat, bones, dairy, etc.)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateLitterData('otherTrash', !litterData.otherTrash)}
                                    style={{
                                        width: "100%",
                                        height: "57px",
                                        borderRadius: "16px",
                                        backgroundColor: litterData.otherTrash ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.otherTrash ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    Other trash
                                </button>

                                {litterData.otherTrash && (
                                    <div style={{ marginTop: "10px" }}>
                                        <textarea
                                            value={litterData.otherTrashText}
                                            onChange={(e) => updateLitterData('otherTrashText', e.target.value)}
                                            placeholder="Please describe the other contamination..."
                                            style={{
                                                width: "100%",
                                                height: "80px",
                                                borderRadius: "16px",
                                                backgroundColor: "#EEEEEE",
                                                border: "1px solid #ACACAC",
                                                fontSize: "16px",
                                                padding: "12px",
                                                fontFamily: "PT Sans, sans-serif",
                                                color: "#8F8F8F",
                                                resize: "none",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Did you remove contamination */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    marginBottom: "20px",
                                    fontFamily: "PT Sans, sans-serif",
                                    color: "#758A48",
                                }}
                            >
                                Did you remove and dispose of the contamination?
                            </h3>
                            
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => updateLitterData('contaminationRemoved', true)}
                                    style={{
                                        flex: 1,
                                        height: "57px",
                                        borderRadius: "26px",
                                        backgroundColor: litterData.contaminationRemoved === true ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.contaminationRemoved ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                    }}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateLitterData('contaminationRemoved', false)}
                                    style={{
                                        flex: 1,
                                        height: "57px",
                                        borderRadius: "26px",
                                        backgroundColor: litterData.contaminationRemoved === false ? "#758A48" : "#FFFFFF",
                                        border: "1px solid #758A48",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        fontFamily: "PT Sans, sans-serif",
                                        color: litterData.contaminationRemoved == false ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                                        cursor: "pointer",
                                    }}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {message && (
                    <div
                        style={{
                            marginBottom: "20px",
                            textAlign: "center",
                            color: "#FB3939",
                            fontFamily: "PT Sans, sans-serif",
                            fontSize: "16px",
                        }}
                    >
                        {message}
                    </div>
                )}
            </form>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                style={{
                    width: "100%",
                    height: "57px",
                    backgroundColor: "#FFFFFF",
                    border: "2px solid #758A48",
                    borderRadius: "69px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    cursor: isFormValid() ? "pointer" : "not-allowed",
                    opacity: isFormValid() ? 1 : 0.6,
                    marginTop: "20px",
                }}
            >
                <span
                    style={{
                        fontSize: "32px",
                        fontFamily: "Lalezar, sans-serif",
                        color: "#758A48",
                    }}
                >
                    NEXT
                </span>
                <FaArrowRight
                    style={{
                        width: "30px",
                        height: "30px",
                        color: "#758A48",
                    }}
                />
            </button>
        </div>
    );
}