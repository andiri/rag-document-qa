# Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from project directory:
```bash
cd rag-document-qa
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **rag-document-qa** (or your choice)
   - Directory? **./** (current directory)
   - Override settings? **N**

5. Set environment variable:
```bash
vercel env add VITE_OPENAI_API_KEY
```
Paste your OpenAI API key when prompted.

6. Redeploy with environment variable:
```bash
vercel --prod
```

### Option 2: GitHub + Vercel Dashboard

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: RAG Document Q&A"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New Project"

4. Import your GitHub repository

5. Configure project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. Add Environment Variables:
   - Key: `VITE_OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Environment: Production, Preview, Development

7. Click "Deploy"

## Post-Deployment

### Verify Deployment

1. Visit your deployed URL
2. Upload a test document
3. Ask a question
4. Verify the answer is generated correctly

### Monitor Usage

- Check OpenAI API usage: https://platform.openai.com/usage
- Monitor Vercel analytics: Your project dashboard

### Update Deployment

For CLI deployment:
```bash
vercel --prod
```

For GitHub integration:
- Just push to main branch
- Vercel will auto-deploy

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard. Common issues:
- Missing dependencies: Run `npm install` locally first
- Environment variables not set
- Node version mismatch

### Runtime Errors

- Check browser console for errors
- Verify `VITE_OPENAI_API_KEY` is set correctly
- Ensure API key has GPT-4 access
- Check OpenAI API status: https://status.openai.com/

### API Rate Limits

If you hit rate limits:
- Implement request queuing
- Add retry logic with exponential backoff
- Consider upgrading OpenAI plan

## Security Recommendations

⚠️ **Important**: The current implementation exposes the OpenAI API key in the browser. For production use:

1. **Create a backend API**:
   - Move OpenAI calls to a server
   - Implement authentication
   - Add rate limiting

2. **Use Vercel Serverless Functions**:
   - Create API routes in `/api` directory
   - Keep API key server-side
   - Proxy requests through your backend

3. **Implement user authentication**:
   - Add login system
   - Track usage per user
   - Set usage quotas

## Cost Optimization

- Use `gpt-3.5-turbo` instead of `gpt-4` for lower costs
- Reduce chunk size to minimize embedding costs
- Implement caching for repeated queries
- Set usage limits per user/session
