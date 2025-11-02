# 📦 Publishing Guide - Version 3.0.0

Complete step-by-step guide to publish your package to npm.

---

## ✅ Pre-Publishing Checklist

### 1. **Version Check**

Your `package.json` shows version `3.0.0`. Verify this is correct:

```json
{
  "version": "3.0.0"
}
```

If you need to update it:

```bash
npm version 3.0.0 --no-git-tag-version
```

### 2. **Update CHANGELOG.md**

✅ Already updated with v3.0.0 changes

### 3. **Update README.md**

✅ Completed with security disclaimers

### 4. **Run Tests**

Make sure all tests pass:

```bash
npm test
```

Expected: All tests should pass (600+ operations, 0 failures)

### 5. **Build the Package**

```bash
npm run build
```

This compiles TypeScript to the `dist/` folder.

### 6. **Verify Build Output**

Check that `dist/` contains:

- `index.js`
- `index.d.ts`
- All service files compiled

```bash
ls dist
```

### 7. **Test the Build Locally**

```bash
npm pack
```

This creates a `.tgz` file you can inspect. Check what will be published:

```bash
tar -tzf mrazakos-vc-ecdsa-crypto-3.0.0.tgz
```

Should include:

- `package/dist/*`
- `package/README.md`
- `package/LICENSE`
- `package/package.json`

---

## 🔑 NPM Authentication

### Check if Logged In

```bash
npm whoami
```

**If you see an error** (not logged in):

### Log In to NPM

```bash
npm login
```

You'll be prompted for:

- Username: `Mrazakos` (or your npm username)
- Password: (your npm password)
- Email: (your email)
- One-Time Password (if 2FA enabled)

---

## 🚀 Publishing Steps

### Option A: Publish with Full Verification (Recommended)

#### Step 1: Dry Run

Test what will be published without actually publishing:

```bash
npm publish --dry-run
```

Review the output carefully. It shows:

- Package name: `@mrazakos/vc-ecdsa-crypto`
- Version: `3.0.0`
- Files included
- Package size

#### Step 2: Publish for Real

If the dry run looks good:

```bash
npm publish --access public
```

**Note:** The `--access public` flag is required for scoped packages (@mrazakos) if you want them to be publicly accessible.

#### Step 3: Verify Publication

```bash
npm view @mrazakos/vc-ecdsa-crypto
```

Should show version `3.0.0` with your latest changes.

### Option B: Quick Publish (If Confident)

```bash
npm run prepublishOnly && npm publish --access public
```

This runs the build script first, then publishes.

---

## 🏷️ Git Tagging (Optional but Recommended)

After successful npm publish, tag the release in git:

```bash
git add .
git commit -m "Release v3.0.0 - Complete rewrite with W3C VC support and security disclaimers"
git tag v3.0.0
git push origin main
git push origin v3.0.0
```

---

## 🧪 Post-Publishing Verification

### 1. Install from NPM

In a **different directory**, test installing your published package:

```bash
mkdir test-install
cd test-install
npm init -y
npm install @mrazakos/vc-ecdsa-crypto
```

### 2. Test Basic Functionality

Create `test.js`:

```javascript
const {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
} = require("@mrazakos/vc-ecdsa-crypto");

async function test() {
  const crypto = new ECDSACryptoService();
  const identity = await crypto.generateIdentity();
  console.log("✅ Package works! Address:", identity.address);
}

test().catch(console.error);
```

Run it:

```bash
node test.js
```

### 3. Check NPM Page

Visit: https://www.npmjs.com/package/@mrazakos/vc-ecdsa-crypto

Verify:

- ✅ Version shows `3.0.0`
- ✅ README displays correctly
- ✅ All badges work
- ✅ License shows MIT
- ✅ TypeScript badge displays

---

## 🐛 Troubleshooting

### Error: "You must verify your email"

Go to npmjs.com and verify your email address first.

### Error: "You do not have permission to publish"

Make sure you're logged in as the package owner:

```bash
npm whoami
```

### Error: "Version 3.0.0 already exists"

If you already published 3.0.0 and need to fix something:

1. Increment version: `npm version patch` (makes it 3.0.1)
2. Update CHANGELOG.md
3. Publish again

**Note:** You CANNOT unpublish or overwrite a published version within 72 hours unless it's a new package.

### Error: "403 Forbidden"

Your token may have expired. Run `npm login` again.

### Build Errors

```bash
npm run clean
npm install
npm run build
```

---

## 📊 Publishing Checklist Summary

```
☐ 1. All tests pass (npm test)
☐ 2. Build succeeds (npm run build)
☐ 3. CHANGELOG.md updated
☐ 4. README.md updated with security warnings
☐ 5. Version number correct in package.json
☐ 6. Logged into npm (npm whoami)
☐ 7. Dry run successful (npm publish --dry-run)
☐ 8. Published to npm (npm publish --access public)
☐ 9. Git commit and tag created
☐ 10. Post-publish verification completed
```

---

## 🎉 After Publishing

### Announce the Release

1. **GitHub Release**: Create a release on GitHub with changelog
2. **Social Media**: Share on Twitter/LinkedIn if applicable
3. **Documentation**: Update any external docs pointing to your package

### Monitor

- Watch for issues: https://github.com/Mrazakos/vc-ecdsa-crypto/issues
- Check download stats: https://npm-stat.com/charts.html?package=@mrazakos/vc-ecdsa-crypto

---

## 🔄 Future Updates

When you need to publish updates:

**Patch (3.0.0 → 3.0.1)** - Bug fixes:

```bash
npm version patch
```

**Minor (3.0.0 → 3.1.0)** - New features (backward compatible):

```bash
npm version minor
```

**Major (3.0.0 → 4.0.0)** - Breaking changes:

```bash
npm version major
```

Then:

```bash
npm publish --access public
git push && git push --tags
```

---

## ⚠️ Important Notes

1. **You cannot unpublish** after 72 hours (npm policy)
2. **You cannot overwrite** a published version - must increment
3. **Package name is permanent** - choose wisely
4. **Security warnings** are now prominent in README - users are informed
5. **Keep your npm account secure** - enable 2FA

---

## 📞 Need Help?

- NPM Support: https://www.npmjs.com/support
- NPM Docs: https://docs.npmjs.com/
- Your Issues: https://github.com/Mrazakos/vc-ecdsa-crypto/issues

---

**Good luck with your publish! 🚀**
