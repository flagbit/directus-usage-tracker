#!/bin/bash

# Fix @shared/constants imports to use relative paths

set -e

echo "🔧 Fixing @shared/constants imports..."

# Module files (2 levels deep)
sed -i.bak "s|from '@shared/constants'|from '../../shared/constants'|g" src/module/composables/use-activity-analytics.ts
sed -i.bak "s|from '@shared/constants'|from '../../shared/constants'|g" src/module/composables/use-collection-analytics.ts
sed -i.bak "s|from '@shared/constants'|from '../../shared/constants'|g" src/module/utils/chart-helpers.ts

# Module index (1 level deep)
sed -i.bak "s|from '@shared/constants'|from '../shared/constants'|g" src/module/index.ts

# Endpoint services (2 levels deep)
sed -i.bak "s|from '@shared/constants'|from '../../shared/constants'|g" src/endpoint/services/activity-service.ts
sed -i.bak "s|from '@shared/constants'|from '../../shared/constants'|g" src/endpoint/services/cache-service.ts
sed -i.bak "s|from '@shared/constants'|from '../../shared/constants'|g" src/endpoint/services/collection-service.ts

# Remove backup files
rm -f src/module/composables/*.bak
rm -f src/module/utils/*.bak
rm -f src/module/*.bak
rm -f src/endpoint/services/*.bak

echo "✅ All imports fixed!"
echo ""
echo "Changed files:"
grep -r "from '.*shared/constants'" src --include="*.ts" | cut -d: -f1 | sort -u
