# Build Error Prevention Guide

## Common Issues and Solutions

### 1. Duplicate Code Detection

**Problem**: Duplicate imports, functions, or entire code sections cause build errors.

**Prevention**:
- Use ESLint with duplicate detection rules
- Add pre-commit hooks to check for duplicates
- Use TypeScript strict mode to catch duplicate definitions

**Detection Script**:
```bash
# Check for duplicate imports in a file
grep -n "^import" file.tsx | sort | uniq -d
```

### 2. Git Secret Management

**Problem**: Secrets committed to git history block pushes.

**Prevention**:
- Use `.gitignore` for all credential files
- Use environment variables for secrets
- Use git-secrets or similar tools
- Never commit: `.json` files with credentials, `.env` files, API keys

**Best Practice**:
```bash
# Add to .gitignore BEFORE first commit
echo "*.json" >> .gitignore  # For credential files
echo ".env*" >> .gitignore
echo "**/firebase*.json" >> .gitignore
```

### 3. Next.js App Router vs Pages Router

**Problem**: Empty `pages/` directory causes Next.js to look for `_document.tsx`.

**Solution**: 
- Remove empty `pages/` directory if using App Router
- Or properly configure Pages Router if needed

### 4. Build Verification

**Always run before committing**:
```bash
npm run build
npm run lint
npm run type-check  # if available
```

