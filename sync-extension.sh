#!/bin/bash

# Sync extension files to mount directory for Docker

set -e

echo "📦 Syncing extension files for Docker..."

# Create mount structure
mkdir -p extensions-mount/directus-extension-usage-analytics/dist
mkdir -p extensions-mount/directus-extension-usage-analytics/node_modules/@shared

# Copy package.json
cp package.json extensions-mount/directus-extension-usage-analytics/

# Copy dist files
cp dist/api.js extensions-mount/directus-extension-usage-analytics/dist/
cp dist/app.js extensions-mount/directus-extension-usage-analytics/dist/

# Copy shared constants as a node_module (workaround for external dependency)
cp -r src/shared/* extensions-mount/directus-extension-usage-analytics/node_modules/@shared/

# Create package.json for @shared module
cat > extensions-mount/directus-extension-usage-analytics/node_modules/@shared/package.json << 'EOF'
{
  "name": "@shared/constants",
  "version": "1.0.0",
  "type": "module",
  "main": "constants.ts",
  "types": "constants.ts"
}
EOF

echo "✅ Extension files synced to extensions-mount/"
echo ""
echo "Structure:"
tree -L 4 extensions-mount/ 2>/dev/null || find extensions-mount/ -type f

echo ""
echo "Ready for Docker mount!"
