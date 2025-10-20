"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailRecipient {
  id: number;
  email: string;
  created_at: string;
}

export function EmailRecipientsManager() {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for adding new recipient
  const [newEmail, setNewEmail] = useState("");
  
  const supabase = createClient();

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alert_email_recipients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (err) {
      console.error('Error fetching recipients:', err);
      setError('Failed to load email recipients');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setSaving(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('alert_email_recipients')
        .insert({
          email: newEmail.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setRecipients(prev => [data, ...prev]);
      setNewEmail("");
      setSuccess('Email recipient added successfully');
    } catch (err: any) {
      console.error('Error adding recipient:', err);
      setError(err.message || 'Failed to add email recipient');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecipient = async (id: number) => {
    if (!confirm('Are you sure you want to remove this email recipient?')) return;

    try {
      const { error } = await supabase
        .from('alert_email_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev => prev.filter(recipient => recipient.id !== id));
      setSuccess('Email recipient removed successfully');
    } catch (err: any) {
      console.error('Error deleting recipient:', err);
      setError('Failed to remove email recipient');
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="space-y-6">
        {/* Add New Recipient Form */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Email Recipient</h3>
          <form onSubmit={addRecipient} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={saving || !newEmail.trim()}
              className="w-full md:w-auto"
            >
              {saving ? "Adding..." : "Add Recipient"}
            </Button>
          </form>
        </div>

        {/* Current Recipients List */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Email Recipients</h3>
          {recipients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No email recipients configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{recipient.email}</h4>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRecipient(recipient.id)}
                    className="bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simple Info */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Alert Emails</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              All recipients in this list will receive email alerts when users report contamination or site issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
