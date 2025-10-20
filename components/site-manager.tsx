"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserManagement } from "@/components/user-management";

interface Site {
  site_id: number;
  site_name: string;
  password: string;
}

export function SiteManager() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSitePassword, setNewSitePassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);
  const [editing, setEditing] = useState(false);
  const [editSiteName, setEditSiteName] = useState("");
  const [editSitePassword, setEditSitePassword] = useState("");
  const supabase = createClient();

  // Fetch sites from database
  const fetchSites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Site')
        .select('*')
        .order('site_name', { ascending: true });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Add new site
  const addSite = async () => {
    if (!newSiteName.trim() || !newSitePassword.trim()) {
      alert('Please fill in both site name and password');
      return;
    }

    try {
      setAdding(true);
      const { error } = await supabase
        .from('Site')
        .insert([
          {
            site_name: newSiteName.trim(),
            password: newSitePassword.trim()
          }
        ]);

      if (error) throw error;
      
      // Reset form and close modal
      setNewSiteName("");
      setNewSitePassword("");
      setShowAddModal(false);
      
      // Refresh the list
      await fetchSites();
    } catch (error) {
      console.error('Error adding site:', error);
      alert('Error adding site. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  // Show edit modal
  const handleEditModal = (site: Site) => {
    setSiteToEdit(site);
    setEditSiteName(site.site_name);
    setEditSitePassword(site.password || ""); // Handle null/undefined passcodes
    setShowEditModal(true);
  };

  // Show delete confirmation
  const showDeleteConfirmation = (site: Site) => {
    setSiteToDelete(site);
    setShowDeleteModal(true);
  };

  // Update site
  const updateSite = async () => {
    if (!siteToEdit || !editSiteName.trim()) {
      alert('Please fill in the site name');
      return;
    }

    try {
      setEditing(true);
      const { error } = await supabase
        .from('Site')
        .update({
          site_name: editSiteName.trim(),
          password: editSitePassword.trim() || null // Allow empty passcodes
        })
        .eq('site_id', siteToEdit.site_id);

      if (error) throw error;
      
      // Close modal and refresh list
      setShowEditModal(false);
      setSiteToEdit(null);
      setEditSiteName("");
      setEditSitePassword("");
      await fetchSites();
    } catch (error) {
      console.error('Error updating site:', error);
      alert('Error updating site. Please try again.');
    } finally {
      setEditing(false);
    }
  };

  // Delete site
  const confirmDelete = async () => {
    if (!siteToDelete) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('Site')
        .delete()
        .eq('site_id', siteToDelete.site_id);

      if (error) throw error;
      
      // Close modal and refresh list
      setShowDeleteModal(false);
      setSiteToDelete(null);
      await fetchSites();
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('Error deleting site. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  if (loading) {
    return <div>Loading sites...</div>;
  }

  return (
    <div className="space-y-8">
      {/* User Management Section */}
      <UserManagement />

      {/* Add Site Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Working Sites</h3>
            <p className="text-gray-600">
              Add and manage working sites where composting activities take place. Each site requires a name and passcode for access.
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="ml-4">
            Add New Site
          </Button>
        </div>
      </div>

      {/* Sites List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Current Sites ({sites.length})</h3>
          <p className="text-gray-600">View and manage all configured working sites</p>
        </div>
        {sites.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500">No sites configured yet. Add your first site to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.site_id}
                className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm bg-white"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">{site.site_name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        ID: {site.site_id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Passcode
                      </span>
                      <div className={`px-3 py-1.5 rounded-md font-mono text-sm font-semibold ${
                        site.password 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {site.password || "None"}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditModal(site)}
                      className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => showDeleteConfirmation(site)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Add New Site
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new working site with a name and passcode
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSiteName("");
                    setNewSitePassword("");
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

              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    type="text"
                    placeholder="e.g., Dalley Park, Chicago, Downtown"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a descriptive name for the working site
                  </p>
                </div>

                <div>
                  <Label htmlFor="sitePassword">Passcode</Label>
                  <Input
                    id="sitePassword"
                    type="text"
                    placeholder="e.g., 1234, SITE2024, PARK001"
                    value={newSitePassword}
                    onChange={(e) => setNewSitePassword(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Create a passcode for site access (can be numbers, letters, or both)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewSiteName("");
                      setNewSitePassword("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addSite}
                    disabled={adding || !newSiteName.trim() || !newSitePassword.trim()}
                  >
                    {adding ? 'Adding...' : 'Add Site'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {showEditModal && siteToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit Site
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Update the site name and passcode
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSiteToEdit(null);
                    setEditSiteName("");
                    setEditSitePassword("");
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

              <div className="space-y-4">
                <div>
                  <Label htmlFor="editSiteName">Site Name</Label>
                  <Input
                    id="editSiteName"
                    type="text"
                    placeholder="e.g., Dalley Park, Chicago, Downtown"
                    value={editSiteName}
                    onChange={(e) => setEditSiteName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a descriptive name for the working site
                  </p>
                </div>

                <div>
                  <Label htmlFor="editSitePassword">Passcode (Optional)</Label>
                  <Input
                    id="editSitePassword"
                    type="text"
                    placeholder="e.g., 1234, SITE2024, PARK001 (leave empty for no passcode)"
                    value={editSitePassword}
                    onChange={(e) => setEditSitePassword(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Create a passcode for site access (can be numbers, letters, or both). Leave empty for no passcode.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSiteToEdit(null);
                      setEditSiteName("");
                      setEditSitePassword("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateSite}
                    disabled={editing || !editSiteName.trim()}
                  >
                    {editing ? 'Updating...' : 'Update Site'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && siteToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Site
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete this site? This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSiteToDelete(null);
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
                {/* Site Information */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800">Site to be deleted:</h4>
                      <p className="text-sm text-red-700 font-semibold">{siteToDelete.site_name}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Site ID: {siteToDelete.site_id} • Passcode: {siteToDelete.password}
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
                        <p>This action will permanently delete the site from the database. This cannot be undone and may affect existing form submissions.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSiteToDelete(null);
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
                    {deleting ? 'Deleting...' : 'Delete Site'}
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
