# Troubleshooting Guide

## Common Issues and Solutions

### PDF.js Version Mismatch Error

**Error Message:**
```
The API version "5.4.394" does not match the Worker version "3.11.174"
```

**Cause:** 
The pdfjs-dist library version doesn't match the PDF worker version.

**Solution:**
✅ **Already Fixed!** The project now uses the local worker file that matches the installed pdfjs-dist version.

The fix is in `src/utils/documentParser.js`:
```javascript
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

---

### Build Errors

#### "Failed to process document"

**Possible Causes:**
1. Invalid OpenAI API key
2. Corrupted document file
3. File size exceeds 10MB

**Solutions:**
- Verify your API key in `.env` file
- Try a different document
- Check file size: `ls -lh your-file.pdf`

#### Tailwind CSS Not Working

**Symptoms:**
- No styling applied
- Build errors related to PostCSS

**Solution:**
Ensure you have the correct Tailwind v4 setup:

```bash
npm install -D @tailwindcss/postcss
```

`postcss.config.js`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

`src/index.css`:
```css
@import "tailwindcss";
```

---

### Runtime Errors

#### "Failed to generate answer"

**Error in Console:**
```
Error: Incorrect API key provided
```

**Solutions:**
1. Check `.env` file exists and has correct key:
   ```bash
   VITE_OPENAI_API_KEY=sk-...
   ```

2. Restart dev server after changing `.env`:
   ```bash
   npm run dev
   ```

3. Verify API key has GPT-4 access at https://platform.openai.com/

#### "Rate limit exceeded"

**Error:**
```
429 Too Many Requests
```

**Solutions:**
- Wait a few minutes before retrying
- Check your OpenAI usage limits
- Consider upgrading your OpenAI plan
- Implement request queuing in production

#### PDF Parsing Fails

**Error:**
```
Failed to parse PDF document
```

**Solutions:**
1. Check if PDF is password-protected (not supported)
2. Try re-saving the PDF
3. Convert to text format as alternative
4. Check browser console for detailed error

---

### Development Issues

#### Port Already in Use

**Error:**
```
Port 5173 is already in use
```

**Solutions:**
```bash
# Option 1: Kill the process
lsof -ti:5173 | xargs kill -9

# Option 2: Use different port
npm run dev -- --port 3000
```

#### Module Not Found

**Error:**
```
Cannot find module 'openai'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Vite Build Warnings

**Warning:**
```
Some chunks are larger than 500 kB
```

**Note:** This is expected due to PDF.js and OpenAI SDK. For production optimization:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist'],
          'openai': ['openai']
        }
      }
    }
  }
})
```

---

### Deployment Issues

#### Vercel Build Fails

**Common Causes:**
1. Missing environment variables
2. Node version mismatch
3. Build command incorrect

**Solutions:**

1. Set environment variables in Vercel dashboard:
   - `VITE_OPENAI_API_KEY`

2. Specify Node version in `package.json`:
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

3. Verify build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### Environment Variables Not Working

**Symptoms:**
- API calls fail in production
- "API key not found" errors

**Solution:**
1. Ensure variable name starts with `VITE_`
2. Redeploy after adding variables
3. Check variable is set for correct environment (Production/Preview)

---

### Performance Issues

#### Slow Document Processing

**Causes:**
- Large document size
- Many chunks to embed
- Network latency

**Solutions:**
- Reduce chunk size in `textChunker.js`
- Implement progress indicators
- Consider server-side processing for large files

#### Slow Answer Generation

**Causes:**
- GPT-4 is slower than GPT-3.5
- Large context sent to API

**Solutions:**
- Switch to `gpt-3.5-turbo` in `gptService.js`
- Reduce number of chunks sent (currently 3)
- Implement streaming responses

---

### Browser Compatibility

#### Safari Issues

**Problem:** PDF parsing may be slower

**Solution:** Already handled - using browser-compatible pdfjs-dist

#### Mobile Browsers

**Problem:** Large file uploads may fail

**Solution:** 
- Reduce max file size
- Add better mobile UI feedback
- Consider compression

---

### API Cost Issues

#### Unexpected High Costs

**Monitoring:**
- Check usage: https://platform.openai.com/usage
- Review token counts in responses

**Optimization:**
```javascript
// Use cheaper model
model: 'gpt-3.5-turbo' // instead of 'gpt-4'

// Reduce chunk size
chunkText(text, chunkSize = 500, overlap = 100)

// Limit search results
searchSimilarChunks(embedding, chunks, 3) // instead of 5
```

---

### Getting Help

If you're still experiencing issues:

1. **Check Browser Console** (F12) for detailed errors
2. **Check Terminal** for server-side errors
3. **Review OpenAI Status**: https://status.openai.com/
4. **GitHub Issues**: Report bugs with:
   - Error message
   - Steps to reproduce
   - Browser/OS information
   - Console logs

---

## Debug Mode

Enable detailed logging:

```javascript
// src/App.jsx
const DEBUG = true;

if (DEBUG) {
  console.log('Document chunks:', document.chunks);
  console.log('Search results:', similarChunks);
  console.log('Reranked results:', rerankedChunks);
}
```

## Health Check

Quick verification checklist:

- [ ] `.env` file exists with valid API key
- [ ] `npm install` completed successfully
- [ ] `npm run build` succeeds
- [ ] Dev server starts without errors
- [ ] Can upload a test document
- [ ] Can ask a question and get response
- [ ] Sources are displayed correctly

---

**Last Updated:** November 18, 2025
