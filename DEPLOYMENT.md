# Gemini 3 Pro Image Preview Demo - Deployment & Setup Guide

This guide covers deploying the application to Vercel and configuring it for first-time use.

## Table of Contents
- [Vercel Deployment](#vercel-deployment)
- [Local Development](#local-development)
- [First-Time Configuration](#first-time-configuration)
- [Testing the Features](#testing-the-features)

---

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add GCP Gemini API support and Image Annotation feature"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository: `LungWai/gemini-3-pro-image-preview-demo`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install`

4. **Environment Variables** (Optional):
   - No server-side environment variables are required
   - All API configuration is stored in the browser's localStorage

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd /path/to/gemini-3-pro-image-preview-demo
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (for first deployment)
   - Project name: `gemini-3-pro-image-preview-demo`
   - Directory: `./`

5. **Production Deployment**:
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The project includes a `vercel.json` file with the following configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

This configuration:
- Uses Vite's build output from the `dist` directory
- Routes API requests to the serverless proxy function (`api/proxy.cjs`)

---

## Local Development

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/LungWai/gemini-3-pro-image-preview-demo.git
cd gemini-3-pro-image-preview-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## First-Time Configuration

After accessing the deployed application (or local dev server), you need to configure the API settings.

### Step 1: Open Settings

Click the **⚙️ Settings** icon in the top-right corner of the application.

### Step 2: Choose API Type

Select one of three API types:

#### Option A: Gemini (Third-Party Providers)
- **API Type**: `Gemini (原生格式)`
- **API URL**: Choose from quick-select buttons or enter custom URL
  - `www.packyapi.com`
  - `poloai.top`
  - `jp.duckcoding.com`
- **Model ID**: `gemini-3-pro-image-preview` (or your provider's model name)
- **API Key**: Your provider's API key
- **Request Mode**: 
  - `客户端直连` (Client Direct) - Faster, but may have CORS issues
  - `服务端转发` (Server Proxy) - Bypasses CORS, requires URL in allowlist

#### Option B: GCP Vertex AI (Official Google Cloud)
- **API Type**: `GCP Vertex AI (官方)`
- **GCP Project ID**: Your Google Cloud project ID (e.g., `my-project-123`)
- **Region**: Select from dropdown (e.g., `us-central1`, `europe-west1`)
- **Model**: Select or enter model name:
  - `gemini-2.0-flash-exp`
  - `gemini-1.5-pro-002`
  - `gemini-1.5-flash-002`
  - `imagen-3.0-generate-002`
- **Authentication**:
  - **API Key**: Use a GCP API key with Vertex AI access
  - **Access Token**: Use OAuth token from `gcloud auth print-access-token`

#### Option C: OpenAI Compatible
- **API Type**: `OpenAI 兼容格式`
- **API URL**: Your OpenAI-compatible endpoint
- **API Key**: Your API key
- Manage models in the "OpenAI 模型管理" section

### Step 3: Save Settings

Click **保存** (Save) to store your configuration in localStorage.

---

## Testing the Features

### Feature 1: GCP Gemini API

1. **Configure GCP Settings**:
   - Open Settings → Select "GCP Vertex AI (官方)"
   - Enter your GCP Project ID
   - Select a region (e.g., `us-central1`)
   - Choose a model (e.g., `gemini-2.0-flash-exp`)
   - Enter API Key or Access Token
   - Save settings

2. **Test Image Generation**:
   - Type a prompt like: "Generate a beautiful sunset over mountains"
   - Click Send or press Enter
   - The image should be generated using Vertex AI

3. **Verify API Endpoint**:
   - The settings dialog shows the full API endpoint:
   ```
   https://us-central1-aiplatform.googleapis.com/v1/projects/{projectId}/locations/us-central1/publishers/google/models/{model}:generateContent
   ```

### Feature 2: Image Annotation

1. **Upload an Image**:
   - Click the **+** button in the input area
   - Select one or more images from your device
   - Images appear as thumbnails above the input

2. **Open Annotation Tool**:
   - Hover over an uploaded image thumbnail
   - Click the **✏️ Pencil** icon (bottom-right of thumbnail)
   - The annotation dialog opens

3. **Use Drawing Tools**:
   | Tool | Icon | Description |
   |------|------|-------------|
   | Pen | ✏️ | Freehand drawing |
   | Rectangle | ⬜ | Draw rectangles |
   | Circle | ⭕ | Draw circles/ellipses |
   | Arrow | ➡️ | Draw arrows |
   | Text | T | Add text labels |
   | Eraser | 🧹 | Erase annotations |

4. **Customize Appearance**:
   - **Colors**: Click color swatches to change stroke color
   - **Stroke Width**: Click width buttons (1, 2, 3, 5)

5. **Edit Actions**:
   - **Undo**: ↩️ Undo last action
   - **Redo**: ↪️ Redo undone action
   - **Clear**: 🗑️ Remove all annotations

6. **Save Annotations**:
   - Click **保存** (Save) to merge annotations onto the image
   - The annotated image replaces the original in the upload strip
   - Click **取消** (Cancel) to discard changes

7. **Send Annotated Image**:
   - After saving, type your prompt
   - The annotated image will be sent to the API
   - Example: "What objects are circled in this image?"

---

## Troubleshooting

### CORS Errors (Client Direct Mode)
- Switch to "服务端转发" (Server Proxy) mode
- Ensure your API URL is in `proxy.allowlist.json`

### GCP Authentication Errors
- Verify your Project ID is correct
- Check that Vertex AI API is enabled in your GCP project
- For Access Token: Ensure it hasn't expired (tokens expire after 1 hour)
- For API Key: Verify it has Vertex AI permissions

### Image Generation Fails
- Check browser console for error messages
- Verify API key/token is valid
- Try a different model or region

### Annotation Dialog Issues
- Ensure the image is fully loaded before annotating
- On mobile: Use touch gestures for drawing
- If canvas is blank: Try closing and reopening the dialog

---

## Project Structure

```
gemini-3-pro-image-preview-demo/
├── api/
│   └── proxy.cjs          # Serverless proxy for CORS bypass
├── src/
│   ├── features/chat/
│   │   ├── components/
│   │   │   ├── ImageAnnotationDialog.tsx  # NEW: Annotation UI
│   │   │   ├── SettingsDialog.tsx         # Updated: GCP config
│   │   │   └── UploadStrip.tsx            # Updated: Annotate button
│   │   ├── services/
│   │   │   ├── geminiClient.ts            # Third-party Gemini API
│   │   │   ├── gcpGeminiClient.ts         # NEW: GCP Vertex AI API
│   │   │   └── openaiClient.ts            # OpenAI-compatible API
│   │   ├── types/
│   │   │   └── annotation.ts              # NEW: Annotation types
│   │   └── utils/
│   │       └── apiConfig.ts               # Updated: GCP config
│   └── App.tsx
├── proxy.allowlist.json   # Allowed proxy target URLs
├── vercel.json            # Vercel deployment config
└── package.json
```

---

## Support

For issues or questions:
- Open an issue on GitHub
- Check the browser console for error details
- Verify API configuration in Settings

