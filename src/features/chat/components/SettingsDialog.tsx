import { useMemo, useState, useEffect, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, Pencil, Plus, Trash2, X, Globe, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  apiConfig,
  type ApiType,
  type RequestMode,
  type GcpRegion,
  type GcpAuthType,
  GCP_REGIONS,
  GCP_MODELS,
} from '../utils/apiConfig';
import { apiSitesConfig, type ApiSite } from '../utils/apiSitesConfig';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState<ApiType>('gemini');
  const [requestMode, setRequestMode] = useState<RequestMode>(apiConfig.getRequestMode());
  const [pendingRequestMode, setPendingRequestMode] = useState<RequestMode | null>(null);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // Gemini 模型配置
  const [geminiModel, setGeminiModel] = useState('');

  const [openAIModels, setOpenAIModels] = useState<string[]>([]);
  const [newOpenAIModel, setNewOpenAIModel] = useState('');
  const [openAIAddError, setOpenAIAddError] = useState('');

  const [editingOpenAIModel, setEditingOpenAIModel] = useState<string | null>(null);
  const [editingOpenAIModelValue, setEditingOpenAIModelValue] = useState('');
  const [openAIEditError, setOpenAIEditError] = useState('');

  const [deleteConfirmModel, setDeleteConfirmModel] = useState<string | null>(null);

  // GCP Gemini 配置
  const [gcpProjectId, setGcpProjectId] = useState('');
  const [gcpRegion, setGcpRegion] = useState<GcpRegion>('us-central1');
  const [gcpModel, setGcpModel] = useState('');
  const [gcpAuthType, setGcpAuthType] = useState<GcpAuthType>('api_key');
  const [gcpAccessToken, setGcpAccessToken] = useState('');

  // API Sites management
  const [apiSites, setApiSites] = useState<ApiSite[]>([]);
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [siteAddError, setSiteAddError] = useState('');
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [editingSiteUrl, setEditingSiteUrl] = useState('');
  const [editingSiteName, setEditingSiteName] = useState('');
  const [siteEditError, setSiteEditError] = useState('');
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState<string | null>(null);
  const [showSitesManager, setShowSitesManager] = useState(false);
  const [apiSitesVisible, setApiSitesVisible] = useState(true);

  const refreshApiSites = useCallback(() => {
    setApiSites(apiSitesConfig.getSites());
  }, []);

  useEffect(() => {
    if (open) {
      setUrl(apiConfig.getUrl() || 'https://generativelanguage.googleapis.com');
      setApiKey(apiConfig.getKey());
      setApiType(apiConfig.getType());
      setRequestMode(apiConfig.getRequestMode());
      setPendingRequestMode(null);
      setRiskDialogOpen(false);
      setError('');

      // Gemini 模型
      setGeminiModel(apiConfig.getGeminiModel());

      setOpenAIModels(apiConfig.getOpenAIModelList());
      setNewOpenAIModel('');
      setOpenAIAddError('');
      setEditingOpenAIModel(null);
      setEditingOpenAIModelValue('');
      setOpenAIEditError('');
      setDeleteConfirmModel(null);

      // GCP 配置
      setGcpProjectId(apiConfig.getGcpProjectId());
      setGcpRegion(apiConfig.getGcpRegion());
      setGcpModel(apiConfig.getGcpModel());
      setGcpAuthType(apiConfig.getGcpAuthType());
      setGcpAccessToken(apiConfig.getGcpAccessToken());

      // API Sites
      refreshApiSites();
      setApiSitesVisible(apiSitesConfig.isVisible());
      setNewSiteUrl('');
      setNewSiteName('');
      setSiteAddError('');
      setEditingSite(null);
      setEditingSiteUrl('');
      setEditingSiteName('');
      setSiteEditError('');
      setDeleteSiteConfirm(null);
      setShowSitesManager(false);
    }
  }, [open, refreshApiSites]);

  useEffect(() => {
    if (apiType !== 'openai') {
      setNewOpenAIModel('');
      setOpenAIAddError('');
      setEditingOpenAIModel(null);
      setEditingOpenAIModelValue('');
      setOpenAIEditError('');
      setDeleteConfirmModel(null);
    }
  }, [apiType]);

  const handleSave = () => {
    // GCP 模式的验证逻辑不同
    if (apiType === 'gcp') {
      if (!gcpProjectId.trim()) {
        setError('请输入 GCP Project ID');
        return;
      }
      if (gcpAuthType === 'api_key' && !apiKey.trim()) {
        setError('请输入 API Key');
        return;
      }
      if (gcpAuthType === 'access_token' && !gcpAccessToken.trim()) {
        setError('请输入 Access Token');
        return;
      }
      // 保存 GCP 配置
      apiConfig.setGcpProjectId(gcpProjectId.trim());
      apiConfig.setGcpRegion(gcpRegion);
      if (gcpModel.trim()) {
        apiConfig.setGcpModel(gcpModel.trim());
      }
      apiConfig.setGcpAuthType(gcpAuthType);
      if (gcpAuthType === 'api_key') {
        apiConfig.setKey(apiKey.trim());
      } else {
        apiConfig.setGcpAccessToken(gcpAccessToken.trim());
      }
      apiConfig.setType(apiType);
      onOpenChange(false);
      return;
    }

    // 非 GCP 模式的验证
    if (!url.trim()) {
      setError('请输入 API URL');
      return;
    }
    if (!apiKey.trim()) {
      setError('请输入 API Key');
      return;
    }
    apiConfig.setUrl(url.trim());
    apiConfig.setKey(apiKey.trim());
    apiConfig.setType(apiType);
    apiConfig.setRequestMode(requestMode);
    // 保存 Gemini 模型
    if (geminiModel.trim()) {
      apiConfig.setGeminiModel(geminiModel.trim());
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    apiConfig.clear();
    apiSitesConfig.reset();
    setUrl('https://generativelanguage.googleapis.com');
    setApiKey('');
    setApiType('gemini');
    setRequestMode(apiConfig.getRequestMode());
    setPendingRequestMode(null);
    setRiskDialogOpen(false);
    setError('');

    // 重置 Gemini 模型为默认值
    setGeminiModel(apiConfig.getGeminiModel());

    setOpenAIModels([]);
    setNewOpenAIModel('');
    setOpenAIAddError('');
    setEditingOpenAIModel(null);
    setEditingOpenAIModelValue('');
    setOpenAIEditError('');
    setDeleteConfirmModel(null);

    // 重置 GCP 配置
    setGcpProjectId('');
    setGcpRegion('us-central1');
    setGcpModel(apiConfig.getGcpModel());
    setGcpAuthType('api_key');
    setGcpAccessToken('');

    // 重置 API Sites
    refreshApiSites();
    setNewSiteUrl('');
    setNewSiteName('');
    setSiteAddError('');
    setShowSitesManager(false);
  };

  const getApiPathHint = () => {
    if (apiType === 'gemini') {
      return `${url || '{url}'}/v1beta/models/${geminiModel || '{model}'}:generateContent`;
    }
    if (apiType === 'gcp') {
      return `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProjectId || '{projectId}'}/locations/${gcpRegion}/publishers/google/models/${gcpModel || '{model}'}:generateContent`;
    }
    return `${url || '{url}'}/v1/chat/completions`;
  };

  const displayRequestMode = pendingRequestMode ?? requestMode;

  const requestModeDescription =
    displayRequestMode === 'server'
      ? 'Requests are forwarded through the server to bypass CORS restrictions. Your API key will be transmitted to the server.'
      : 'Browser connects directly to the API. May encounter CORS issues.';

  const handleRequestModeChange = (next: RequestMode) => {
    if (next === requestMode) return;

    if (next === 'server') {
      setPendingRequestMode('server');
      setRiskDialogOpen(true);
      return;
    }

    setPendingRequestMode(null);
    setRequestMode('client');
    apiConfig.setRequestMode('client');
  };

  const confirmServerMode = () => {
    setRiskDialogOpen(false);
    setPendingRequestMode(null);
    setRequestMode('server');
    apiConfig.setRequestMode('server');
  };

  const cancelServerMode = () => {
    setRiskDialogOpen(false);
    setPendingRequestMode(null);
    setRequestMode('client');
    apiConfig.setRequestMode('client');
  };

  const normalizedOpenAIModels = useMemo(() => openAIModels.map((item) => item.trim()).filter(Boolean), [openAIModels]);

  const refreshOpenAIModels = () => setOpenAIModels(apiConfig.getOpenAIModelList());

  const startEditingModel = (modelName: string) => {
    setEditingOpenAIModel(modelName);
    setEditingOpenAIModelValue(modelName);
    setOpenAIEditError('');
  };

  const cancelEditingModel = () => {
    setEditingOpenAIModel(null);
    setEditingOpenAIModelValue('');
    setOpenAIEditError('');
  };

  const submitNewModel = () => {
    const normalized = newOpenAIModel.trim();
    if (!normalized) {
      setOpenAIAddError('请输入模型名称');
      return;
    }
    if (normalizedOpenAIModels.includes(normalized)) {
      setOpenAIAddError('模型名称已存在');
      return;
    }

    apiConfig.addOpenAIModel(normalized);
    refreshOpenAIModels();
    setNewOpenAIModel('');
    setOpenAIAddError('');
  };

  const submitEditModel = () => {
    if (!editingOpenAIModel) return;

    const oldName = editingOpenAIModel.trim();
    const nextName = editingOpenAIModelValue.trim();

    if (!nextName) {
      setOpenAIEditError('请输入模型名称');
      return;
    }

    if (nextName === oldName) {
      cancelEditingModel();
      return;
    }

    if (normalizedOpenAIModels.includes(nextName)) {
      setOpenAIEditError('模型名称已存在');
      return;
    }

    apiConfig.updateOpenAIModel(oldName, nextName);
    refreshOpenAIModels();
    cancelEditingModel();
  };

  const confirmDeleteModel = () => {
    if (!deleteConfirmModel) return;
    apiConfig.removeOpenAIModel(deleteConfirmModel);
    refreshOpenAIModels();
    if (editingOpenAIModel === deleteConfirmModel) cancelEditingModel();
    setDeleteConfirmModel(null);
  };

  // API Sites management functions
  const submitNewSite = () => {
    const normalizedUrl = newSiteUrl.trim();
    if (!normalizedUrl) {
      setSiteAddError('Please enter a URL');
      return;
    }
    try {
      new URL(normalizedUrl);
    } catch {
      setSiteAddError('Invalid URL format');
      return;
    }
    if (apiSitesConfig.addSite(normalizedUrl, newSiteName)) {
      refreshApiSites();
      setNewSiteUrl('');
      setNewSiteName('');
      setSiteAddError('');
    } else {
      setSiteAddError('Site already exists or failed to save');
    }
  };

  const startEditingSite = (site: ApiSite) => {
    setEditingSite(site.url);
    setEditingSiteUrl(site.url);
    setEditingSiteName(site.name);
    setSiteEditError('');
  };

  const cancelEditingSite = () => {
    setEditingSite(null);
    setEditingSiteUrl('');
    setEditingSiteName('');
    setSiteEditError('');
  };

  const submitEditSite = () => {
    if (!editingSite) return;
    const normalizedUrl = editingSiteUrl.trim();
    if (!normalizedUrl) {
      setSiteEditError('Please enter a URL');
      return;
    }
    try {
      new URL(normalizedUrl);
    } catch {
      setSiteEditError('Invalid URL format');
      return;
    }
    if (apiSitesConfig.updateSite(editingSite, normalizedUrl, editingSiteName)) {
      refreshApiSites();
      cancelEditingSite();
    } else {
      setSiteEditError('Failed to update site');
    }
  };

  const confirmDeleteSite = () => {
    if (!deleteSiteConfirm) return;
    apiSitesConfig.removeSite(deleteSiteConfirm);
    refreshApiSites();
    if (editingSite === deleteSiteConfirm) cancelEditingSite();
    setDeleteSiteConfirm(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            管理您的应用首选项和 API 连接
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 overflow-y-auto flex-1 -mx-6 px-6">
          {/* API 配置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">API 配置</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-type">API 类型</Label>
                <Select value={apiType} onValueChange={(value: ApiType) => setApiType(value)}>
                  <SelectTrigger id="api-type">
                    <SelectValue placeholder="选择 API 类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini (原生格式)</SelectItem>
                    <SelectItem value="openai">OpenAI 兼容格式</SelectItem>
                    <SelectItem value="gcp">GCP Vertex AI (官方)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {apiType === 'gemini'
                    ? '使用 Gemini 原生 API 格式，支持图片生成和编辑'
                    : apiType === 'gcp'
                    ? '使用 Google Cloud Vertex AI 官方 API，需要 GCP 项目配置'
                    : '使用 OpenAI 兼容 API 格式，适用于普通 Chat 对话'}
                </p>
              </div>

              {/* Gemini 模型 ID 输入 */}
              {apiType === 'gemini' && (
                <div className="space-y-2">
                  <Label htmlFor="gemini-model">模型 ID</Label>
                  <Input
                    id="gemini-model"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    placeholder="gemini-3-pro-image-preview"
                  />
                  <p className="text-xs text-muted-foreground">
                    输入 Gemini 模型名称，如 gemini-3-pro-image-preview
                  </p>
                </div>
              )}

              {/* GCP Vertex AI 配置 */}
              {apiType === 'gcp' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gcp-project-id">GCP Project ID</Label>
                    <Input
                      id="gcp-project-id"
                      value={gcpProjectId}
                      onChange={(e) => setGcpProjectId(e.target.value)}
                      placeholder="my-gcp-project"
                    />
                    <p className="text-xs text-muted-foreground">
                      您的 Google Cloud 项目 ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gcp-region">区域</Label>
                    <Select value={gcpRegion} onValueChange={(value: GcpRegion) => setGcpRegion(value)}>
                      <SelectTrigger id="gcp-region">
                        <SelectValue placeholder="选择区域" />
                      </SelectTrigger>
                      <SelectContent>
                        {GCP_REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gcp-model">模型</Label>
                    <Select value={gcpModel} onValueChange={setGcpModel}>
                      <SelectTrigger id="gcp-model">
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {GCP_MODELS.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={gcpModel}
                      onChange={(e) => setGcpModel(e.target.value)}
                      placeholder="或输入自定义模型名称"
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gcp-auth-type">认证方式</Label>
                    <Select value={gcpAuthType} onValueChange={(value: GcpAuthType) => setGcpAuthType(value)}>
                      <SelectTrigger id="gcp-auth-type">
                        <SelectValue placeholder="选择认证方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="access_token">Access Token (OAuth)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {gcpAuthType === 'api_key'
                        ? '使用 GCP API Key 进行认证'
                        : '使用 OAuth Access Token 进行认证（通过 gcloud auth print-access-token 获取）'}
                    </p>
                  </div>

                  {gcpAuthType === 'access_token' && (
                    <div className="space-y-2">
                      <Label htmlFor="gcp-access-token">Access Token</Label>
                      <Input
                        id="gcp-access-token"
                        type="password"
                        value={gcpAccessToken}
                        onChange={(e) => setGcpAccessToken(e.target.value)}
                        placeholder="输入 OAuth Access Token"
                      />
                      <p className="text-xs text-muted-foreground">
                        运行 <code className="bg-muted px-1 rounded">gcloud auth print-access-token</code> 获取
                      </p>
                    </div>
                  )}

                  {gcpAuthType === 'api_key' && (
                    <div className="space-y-2">
                      <Label htmlFor="gcp-api-key">API Key</Label>
                      <Input
                        id="gcp-api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入 GCP API Key"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground break-all">
                      请求地址：{getApiPathHint()}
                    </p>
                  </div>
                </>
              )}

              {/* 非 GCP 模式的 URL 和 Key 配置 */}
              {apiType !== 'gcp' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="api-url">API URL</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const newVisible = !apiSitesVisible;
                            setApiSitesVisible(newVisible);
                            apiSitesConfig.setVisible(newVisible);
                          }}
                          title={apiSitesVisible ? 'Hide quick sites' : 'Show quick sites'}
                        >
                          {apiSitesVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-primary"
                          onClick={() => setShowSitesManager(!showSitesManager)}
                        >
                          <Globe className="h-3 w-3" />
                          {showSitesManager ? 'Hide Sites' : 'Manage Sites'}
                        </Button>
                      </div>
                    </div>
                    <Input
                      id="api-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://generativelanguage.googleapis.com"
                      className="ios-input"
                    />
                    {apiSitesVisible && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {apiSites.map((site) => (
                          <Button
                            key={site.url}
                            type="button"
                            size="sm"
                            variant={url.trim() === site.url ? 'secondary' : 'outline'}
                            className="h-7 px-2 text-xs rounded-lg ios-pressable"
                            onClick={() => setUrl(site.url)}
                            title={site.url}
                          >
                            {site.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Endpoint: {getApiPathHint()}
                    </p>
                  </div>
                  {/* API Sites Manager */}
                  {showSitesManager && (
                    <div className="space-y-3 rounded-xl border p-4 bg-muted/30">
                      <div className="space-y-2">
                        <Label className="text-xs">Add New Site</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newSiteUrl}
                            onChange={(e) => {
                              setNewSiteUrl(e.target.value);
                              if (siteAddError) setSiteAddError('');
                            }}
                            placeholder="https://api.example.com"
                            className="h-9 flex-1"
                          />
                          <Input
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                            placeholder="Name (optional)"
                            className="h-9 w-28"
                          />
                          <Button type="button" variant="secondary" size="sm" className="h-9" onClick={submitNewSite}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {siteAddError && <p className="text-xs text-destructive">{siteAddError}</p>}
                      </div>

                      <div className="rounded-lg border overflow-hidden bg-background">
                        <div className="bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          Saved API Sites
                        </div>
                        {apiSites.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-muted-foreground">
                            No sites configured.
                          </div>
                        ) : (
                          <div className="divide-y">
                            {apiSites.map((site) => {
                              const isEditing = editingSite === site.url;
                              return (
                                <div key={site.url} className="flex items-center gap-2 px-3 py-2">
                                  <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                      <div className="space-y-1">
                                        <Input
                                          value={editingSiteUrl}
                                          onChange={(e) => {
                                            setEditingSiteUrl(e.target.value);
                                            if (siteEditError) setSiteEditError('');
                                          }}
                                          className="h-8"
                                          placeholder="URL"
                                        />
                                        <Input
                                          value={editingSiteName}
                                          onChange={(e) => setEditingSiteName(e.target.value)}
                                          className="h-8"
                                          placeholder="Name"
                                        />
                                        {siteEditError && <p className="text-xs text-destructive">{siteEditError}</p>}
                                      </div>
                                    ) : (
                                      <>
                                        <div className="truncate text-sm font-medium">{site.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">{site.url}</div>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {isEditing ? (
                                      <>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={submitEditSite} title="Save">
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditingSite} title="Cancel">
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        {!site.isDefault && (
                                          <>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditingSite(site)} title="Edit">
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteSiteConfirm(site.url)} title="Delete">
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API Key"
                      className="ios-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      {apiType === 'gemini'
                        ? 'Key sent via x-goog-api-key header'
                        : 'Key sent via Authorization: Bearer header'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="request-mode">Request Mode</Label>
                    <Select value={displayRequestMode} onValueChange={(value: RequestMode) => handleRequestModeChange(value)}>
                      <SelectTrigger id="request-mode">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Direct (Client)</SelectItem>
                        <SelectItem value="server">Proxy (Server)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{requestModeDescription}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {apiType === 'openai' && (
            <div className="pt-6 space-y-4">
              <Separator />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">OpenAI 模型管理</h3>
                <p className="text-xs text-muted-foreground">
                  管理可选模型列表（用于聊天栏下拉选择），变更将立即写入 localStorage。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model-new">新增模型</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-model-new"
                    value={newOpenAIModel}
                    onChange={(e) => {
                      setNewOpenAIModel(e.target.value);
                      if (openAIAddError) setOpenAIAddError('');
                    }}
                    placeholder="例如：gpt-4o-mini"
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitNewModel();
                    }}
                  />
                  <Button type="button" variant="secondary" className="h-9" onClick={submitNewModel}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增
                  </Button>
                </div>
                {openAIAddError && <p className="text-xs text-destructive">{openAIAddError}</p>}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  当前模型列表
                </div>
                {openAIModels.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    暂无模型，请先添加一个（例如 gpt-4o-mini）。
                  </div>
                ) : (
                  <div className="divide-y">
                    {openAIModels.map((item) => {
                      const isEditing = editingOpenAIModel === item;
                      return (
                        <div key={item} className="flex items-center gap-2 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="space-y-1">
                                <Input
                                  value={editingOpenAIModelValue}
                                  onChange={(e) => {
                                    setEditingOpenAIModelValue(e.target.value);
                                    if (openAIEditError) setOpenAIEditError('');
                                  }}
                                  className="h-8"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitEditModel();
                                    if (e.key === 'Escape') cancelEditingModel();
                                  }}
                                />
                                {openAIEditError && <p className="text-xs text-destructive">{openAIEditError}</p>}
                              </div>
                            ) : (
                              <div className="truncate text-sm font-mono text-foreground">{item}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={submitEditModel}
                                  title="保存"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={cancelEditingModel}
                                  title="取消"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => startEditingModel(item)}
                                  title="编辑"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirmModel(item)}
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 删除模型确认 */}
      <Dialog
        open={!!deleteConfirmModel}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteConfirmModel(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>删除模型</DialogTitle>
            <DialogDescription>
              确认删除该模型吗？删除后会立即从列表中移除。
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm">
            <span className="text-muted-foreground">模型：</span>
            <span className="font-mono">{deleteConfirmModel ?? ''}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmModel(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModel}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete API Site Confirmation */}
      <Dialog
        open={!!deleteSiteConfirm}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteSiteConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Delete API Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this site from your saved list?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm">
            <span className="text-muted-foreground">Site: </span>
            <span className="font-mono text-xs break-all">{deleteSiteConfirm ?? ''}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteSiteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSite}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Server Proxy Mode Warning */}
      <Dialog
        open={riskDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) cancelServerMode();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Enable Server Proxy</DialogTitle>
            <DialogDescription>
              This mode can bypass CORS restrictions but involves API key transmission risks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              The server <strong>will not store</strong> your API key, but it <strong>will be transmitted</strong> through the server to forward your requests.
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Do not share this page URL in untrusted network environments.</li>
              <li>Consider using a test key with limited quota.</li>
              <li>For maximum security, use direct client mode with a CORS-enabled API.</li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelServerMode}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmServerMode}>
              I Understand, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
