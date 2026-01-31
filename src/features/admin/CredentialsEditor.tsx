import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, AlertCircle, CheckCircle2, Shield, Key, FileJson, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth';

interface CredentialsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Credentials {
  gcpProjectId: string;
  gcpApiKey: string;
  gcpServiceAccountJson: string;
}

interface CredentialStatus {
  gcpProjectId: string;
  hasApiKey: boolean;
  hasServiceAccount: boolean;
  isConfigured: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function CredentialsEditor({ open, onOpenChange }: CredentialsEditorProps) {
  const { isAuthenticated, logout } = useAuth();
  const [credentials, setCredentials] = useState<Credentials>({
    gcpProjectId: '',
    gcpApiKey: '',
    gcpServiceAccountJson: '',
  });
  const [status, setStatus] = useState<CredentialStatus>({
    gcpProjectId: '',
    hasApiKey: false,
    hasServiceAccount: false,
    isConfigured: false,
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Load current credentials when dialog opens
  useEffect(() => {
    if (open && isAuthenticated) {
      loadCredentials();
    }
  }, [open, isAuthenticated]);

  const loadCredentials = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/credentials');
      if (response.ok) {
        const data = await response.json();
        const credStatus: CredentialStatus = {
          gcpProjectId: data.gcpProjectId || '',
          hasApiKey: !!data.gcpApiKey,
          hasServiceAccount: !!data.hasServiceAccount,
          isConfigured: !!(data.gcpProjectId && (data.gcpApiKey || data.hasServiceAccount)),
        };
        setStatus(credStatus);
        setCredentials({
          gcpProjectId: data.gcpProjectId || '',
          gcpApiKey: data.gcpApiKey ? '••••••••' : '',
          gcpServiceAccountJson: data.hasServiceAccount ? '(Service account configured)' : '',
        });
        // Show edit form if not configured
        setShowEditForm(!credStatus.isConfigured);
      } else {
        setError('Failed to load credentials status');
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
      setError('Network error loading credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setError('');

    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcpProjectId: credentials.gcpProjectId,
          gcpApiKey: credentials.gcpApiKey.startsWith('••') ? undefined : credentials.gcpApiKey,
          gcpServiceAccountJson: credentials.gcpServiceAccountJson.startsWith('(')
            ? undefined
            : credentials.gcpServiceAccountJson,
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        await loadCredentials(); // Reload to update status
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save credentials');
        setSaveStatus('error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setSaveStatus('error');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Status indicator component
  const StatusBadge = ({ configured, label }: { configured: boolean; label: string }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      configured ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    }`}>
      {configured ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] ios-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Panel
          </DialogTitle>
          <DialogDescription>
            {status.isConfigured
              ? 'GCP credentials are configured. You can update them below.'
              : 'Welcome! Set up your GCP credentials to get started.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Status Overview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Credential Status</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <StatusBadge
                  configured={!!status.gcpProjectId}
                  label={status.gcpProjectId ? `Project: ${status.gcpProjectId.slice(0, 12)}...` : 'No Project ID'}
                />
                <StatusBadge
                  configured={status.hasApiKey}
                  label={status.hasApiKey ? 'API Key Set' : 'No API Key'}
                />
                <StatusBadge
                  configured={status.hasServiceAccount}
                  label={status.hasServiceAccount ? 'Service Account' : 'No Service Account'}
                />
              </div>
            </div>

            {/* Toggle Edit Form */}
            {status.isConfigured && !showEditForm && (
              <Button
                variant="outline"
                className="w-full ios-pressable"
                onClick={() => setShowEditForm(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Credentials
              </Button>
            )}

            {/* Edit Form */}
            {showEditForm && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="gcp-project-id" className="flex items-center gap-2">
                    <Settings className="h-3 w-3" />
                    GCP Project ID
                  </Label>
                  <Input
                    id="gcp-project-id"
                    value={credentials.gcpProjectId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, gcpProjectId: e.target.value }))}
                    placeholder="my-gcp-project"
                    className="ios-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gcp-api-key" className="flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    API Key
                  </Label>
                  <Input
                    id="gcp-api-key"
                    type="password"
                    value={credentials.gcpApiKey}
                    onChange={(e) => setCredentials(prev => ({ ...prev, gcpApiKey: e.target.value }))}
                    placeholder="Enter GCP API Key"
                    className="ios-input"
                  />
                  {status.hasApiKey && (
                    <p className="text-xs text-muted-foreground">
                      Leave unchanged to keep existing key.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gcp-service-account" className="flex items-center gap-2">
                    <FileJson className="h-3 w-3" />
                    Service Account JSON (Optional)
                  </Label>
                  <Textarea
                    id="gcp-service-account"
                    value={credentials.gcpServiceAccountJson}
                    onChange={(e) => setCredentials(prev => ({ ...prev, gcpServiceAccountJson: e.target.value }))}
                    placeholder='{"type": "service_account", ...}'
                    className="ios-input min-h-[100px] font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive"
          >
            Sign Out
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {status.isConfigured ? 'Close' : 'Cancel'}
          </Button>
          {showEditForm && (
            <Button
              onClick={handleSave}
              disabled={saveStatus === 'saving' || isLoading}
              className="ios-pressable"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Credentials
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

