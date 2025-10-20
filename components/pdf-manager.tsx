"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PDFFile {
  name: string;
  id: string;
  created_at: string;
  size: number;
  publicUrl: string;
}

export function PDFManager() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PDFFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  // Fetch PDFs from DNREC bucket
  const fetchPDFs = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from('DNREC')
        .list('', {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      const pdfFiles = data
        .filter(file => file.name.endsWith('.pdf'))
        .map(file => ({
          name: file.name,
          id: file.id,
          created_at: file.created_at,
          size: file.metadata?.size || 0,
          publicUrl: supabase.storage.from('DNREC').getPublicUrl(file.name).data.publicUrl
        }));

      setFiles(pdfFiles);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Upload PDF to bucket
  const uploadPDF = async (file: File) => {
    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from('DNREC')
        .upload(file.name, file);

      if (error) throw error;
      
      await fetchPDFs(); // Refresh the list
    } catch (error) {
      console.error('Error uploading PDF:', error);
    } finally {
      setUploading(false);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (file: PDFFile) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  // Delete PDF from bucket
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase.storage
        .from('DNREC')
        .remove([fileToDelete.name]);

      if (error) throw error;
      
      await fetchPDFs(); // Refresh the list
      
      // Close modal
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error deleting PDF:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Download PDF
  const downloadPDF = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('DNREC')
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, [fetchPDFs]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      uploadPDF(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div>Loading PDFs...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-cyan-100 border-4 border-earthyBlue rounded-xl shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload PDF</h3>
          <p className="text-gray-700">Select a PDF file to upload to the DNREC storage bucket</p>
        </div>
        <div>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="mb-4 border-2 border-earthyBlue bg-cyan-50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400"
          />
          {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
        </div>
      </div>

      {/* PDF List */}
      <div className="bg-green-100 border-4 border-earthyLightGreen rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Documents ({files.length})</h3>
          <p className="text-gray-700">Manage your PDF files in the DNREC storage bucket</p>
        </div>
        {files.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No PDFs found in the DNREC bucket.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-earthyLightGreen rounded-lg hover:bg-earthyGreen transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPDF(file.name)}
                    className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.publicUrl, '_blank')}
                    className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300"
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showDeleteConfirmation(file)}
                    className="border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete PDF File
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete this PDF file? This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFileToDelete(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-black">
                {/* File Information */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800">File to be deleted:</h4>
                      <p className="text-sm text-red-700 font-semibold">{fileToDelete.name}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Size: {formatFileSize(fileToDelete.size)} • 
                        Created: {new Date(fileToDelete.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Warning
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This action will permanently delete the PDF file from the storage bucket. This cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setFileToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className={`px-4 py-2 rounded transition-colors ${
                      deleting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {deleting ? 'Deleting...' : 'Delete File'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}