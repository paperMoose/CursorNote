# Publishing to VS Code Marketplace

## Prerequisites Checklist

Before publishing, make sure you have:

- [ ] A Microsoft account
- [ ] A unique publisher ID
- [ ] A Personal Access Token (PAT) from Azure DevOps
- [ ] An icon for your extension (128x128 PNG recommended)
- [ ] Updated README.md with screenshots and usage instructions
- [ ] LICENSE file

## Step-by-Step Publishing Guide

### 1. Create Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with your Microsoft account
3. Click "Create publisher"
4. Fill in:
   - **Publisher ID**: Choose a unique ID (e.g., `papermoose` or `ryanbrandt`)
   - **Publisher name**: Your display name
   - **Description**: Brief description of who you are

### 2. Get Personal Access Token

1. Go to https://dev.azure.com/
2. Click **User Settings** (profile icon) → **Personal Access Tokens**
3. Click **+ New Token**
4. Configure:
   - **Name**: "VS Code Publishing"
   - **Organization**: Select **All accessible organizations**
   - **Expiration**: 1 year (or custom)
   - **Scopes**: Click "Show all scopes" → **Marketplace** → Check **Manage**
5. Click **Create**
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### 3. Update package.json

Replace `"publisher": "your-publisher-name"` with your actual publisher ID:

```json
{
  "publisher": "your-actual-publisher-id"
}
```

### 4. Add an Icon (Recommended)

Create or add a 128x128 PNG icon:

```bash
# If you have an icon
mv your-icon.png media/icon.png
```

If you don't have an icon, you can skip this for now (but it's recommended for marketplace visibility).

### 5. Login to vsce

```bash
npx vsce login your-publisher-id
```

When prompted, paste your Personal Access Token.

### 6. Publish!

#### First Time Publishing

```bash
npx vsce publish
```

This will:
- Validate your package
- Bump the version (or you can specify: `vsce publish 0.1.0`)
- Upload to the marketplace

#### Update Existing Extension

```bash
# Patch version (0.1.0 → 0.1.1)
npx vsce publish patch

# Minor version (0.1.0 → 0.2.0)
npx vsce publish minor

# Major version (0.1.0 → 1.0.0)
npx vsce publish major

# Or specify exact version
npx vsce publish 0.2.0
```

## Common Issues & Solutions

### "Publisher not found"

- Make sure you've created the publisher at https://marketplace.visualstudio.com/manage
- Verify the publisher ID in package.json matches exactly

### "Authentication failed"

- Your PAT might have expired or been revoked
- Make sure you selected "All accessible organizations" when creating the PAT
- Ensure you checked "Marketplace → Manage" scope

### "Missing README"

- Add a README.md with installation and usage instructions
- VS Code requires a README for marketplace listing

### "Icon not found"

- Either add an icon.png or remove the `"icon"` field from package.json
- Icon should be at least 128x128 pixels

## After Publishing

1. **View your extension**: https://marketplace.visualstudio.com/items?itemName=your-publisher.markdown-wysiwyg
2. **Install from marketplace**:
   ```
   code --install-extension your-publisher.markdown-wysiwyg
   ```
3. **Or search in VS Code**: Extensions panel → Search "Markdown WYSIWYG"

## Updating Your Extension

When you make changes:

```bash
# 1. Make your changes
# 2. Update version and commit
npm version patch  # or minor/major
git add .
git commit -m "Version bump"
git push

# 3. Publish update
npx vsce publish
```

## Unpublishing

If you need to remove your extension:

```bash
npx vsce unpublish your-publisher.markdown-wysiwyg
```

⚠️ **Warning**: Unpublishing is permanent and requires republishing with a higher version number.

## Resources

- [Publishing Extensions Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Marketplace](https://marketplace.visualstudio.com/)
- [Azure DevOps PAT](https://dev.azure.com/)
