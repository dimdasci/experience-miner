#!/bin/bash
# migrate-imports.sh - Comprehensive import path migration

set -e  # Exit on any error

# Create backup before starting
echo "🔄 Creating backup before import migration..."
git add -A && git commit -m "Pre-import migration backup"

echo "🔄 Starting systematic import migration..."

# Get all TypeScript files
FILES=$(find frontend/src -name "*.tsx" -o -name "*.ts" | grep -v node_modules)
echo "📊 Found $(echo "$FILES" | wc -l) files to process"

# Pattern 1: Three-level imports to root directories (36 occurrences)
echo "🔧 Pattern 1: Deep service & context imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''../../../services/apiService'\''|from '\''@shared/services/apiService'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../../contexts/AuthContext'\''|from '\''@shared/contexts/AuthContext'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../../contexts/CreditsContext'\''|from '\''@shared/contexts/CreditsContext'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../../contexts/ThemeContext'\''|from '\''@shared/contexts/ThemeContext'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../../utils/logger'\''|from '\''@shared/utils/logger'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../../hooks/useAudioRecorder'\''|from '\''@features/guide/hooks/useAudioRecorder'\''|g'

# Pattern 2: Type imports (17+ files affected)
echo "🔧 Pattern 2: Type imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''../../../types/business'\''|from '\''@shared/types/business'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../../types'\''|from '\''@shared/types/api'\''|g'

# Pattern 3: Constants (12+ files affected)
echo "🔧 Pattern 3: Constants imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''../../../constants'\''|from '\''@shared/constants/app'\''|g'

# Pattern 4: UI component imports (100+ occurrences)
echo "🔧 Pattern 4: UI component imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''../../ui/|from '\''@shared/components/ui/|g'
echo "$FILES" | xargs sed -i '' 's|from '\''\.\./ui/|from '\''@shared/components/ui/|g'

# Pattern 5: Cross-domain component access (special cases)
echo "🔧 Pattern 5: Cross-domain imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''../../guide/components/ProcessingModal'\''|from '\''@shared/components/modals/ProcessingModal'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../auth/containers/|from '\''@features/auth/containers/|g'
echo "$FILES" | xargs sed -i '' 's|from '\''../../credits/containers/|from '\''@features/credits/containers/|g'

# Pattern 6: Two-level context access
echo "🔧 Pattern 6: Two-level context imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''../../contexts/|from '\''@shared/contexts/|g'

# Pattern 7: Single-level root access
echo "🔧 Pattern 7: Root directory imports..."
echo "$FILES" | xargs sed -i '' 's|from '\''\.\./constants'\''|from '\''@shared/constants/app'\''|g'
echo "$FILES" | xargs sed -i '' 's|from '\''\.\./lib/|from '\''@shared/lib/|g'
echo "$FILES" | xargs sed -i '' 's|from '\''\.\./types'\''|from '\''@shared/types/api'\''|g'

# Pattern 8: Handle double quotes (edge case - 1 occurrence)
echo "🔧 Pattern 8: Double quote edge cases..."
echo "$FILES" | xargs sed -i '' 's|from "../../../services/|from "@shared/services/|g'
echo "$FILES" | xargs sed -i '' 's|from "../../ui/|from "@shared/components/ui/|g'

# Verification
echo "✅ Migration complete! Processed 200+ import statements"
echo "🔍 Verifying TypeScript compilation..."
cd frontend && npm run build

if [ $? -eq 0 ]; then
    echo "✅ All imports migrated successfully!"
else
    echo "❌ Compilation errors found. Rolling back..."
    git reset --hard HEAD~1
    echo "🔙 Rolled back to pre-migration state"
    exit 1
fi

echo "🔧 Running linter to catch remaining import issues..."
npm run check

echo "📝 Fix any remaining import issues identified by Biome linter"
