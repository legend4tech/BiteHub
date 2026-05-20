"use client";

import { useState } from "react";
import { VendorSettingsForm } from "@/components/vendor/VendorSettingsForm";
import { VendorSecurityForms } from "@/components/vendor/VendorSecurityForms";
import { Settings, Shield } from "lucide-react";

export function VendorSettingsTabs({ 
  serializedVendor, 
  currentEmail 
}: { 
  serializedVendor: any; 
  currentEmail: string; 
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your store and account details</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Settings className="size-4" />
          Store Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Shield className="size-4" />
          Account Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-card border border-border p-6 max-w-2xl">
              <VendorSettingsForm initial={serializedVendor} />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-card border border-border p-6 max-w-2xl">
              <VendorSecurityForms currentEmail={currentEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
