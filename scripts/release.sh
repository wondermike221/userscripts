#!/bin/bash

# Userscript Release Script
# Bumps version, rebuilds, and commits changes

set -e

SCRIPTS_DIR="src"
META_FILES=(
  "src/fedex-form-filler/meta.js"
  "src/snow/meta.js"
  "src/shadow-query-console/meta.js"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Userscript Release Tool${NC}"
echo ""

# Function to get current version from meta.js
get_version() {
  local meta_file=$1
  grep "@version" "$meta_file" | sed -E 's/.*@version\s+([0-9]+\.[0-9]+\.[0-9]+).*/\1/'
}

# Function to bump version
bump_version() {
  local version=$1
  local bump_type=$2

  IFS='.' read -r major minor patch <<< "$version"

  case $bump_type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "Invalid bump type: $bump_type"
      exit 1
      ;;
  esac

  echo "$major.$minor.$patch"
}

# Function to update version in meta.js
update_version() {
  local meta_file=$1
  local new_version=$2

  # macOS and Linux compatible sed
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' -E "s/(@version\s+)[0-9]+\.[0-9]+\.[0-9]+/\1$new_version/" "$meta_file"
  else
    sed -i -E "s/(@version\s+)[0-9]+\.[0-9]+\.[0-9]+/\1$new_version/" "$meta_file"
  fi
}

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
  exit 1
fi

echo "Available userscripts:"
echo ""
for i in "${!META_FILES[@]}"; do
  meta_file="${META_FILES[$i]}"
  script_name=$(basename $(dirname "$meta_file"))
  current_version=$(get_version "$meta_file")
  echo "  $((i+1)). $script_name (v$current_version)"
done
echo ""

read -p "Which script(s) to release? (comma-separated numbers, or 'all'): " selection

# Determine which scripts to release
scripts_to_release=()
if [ "$selection" == "all" ]; then
  scripts_to_release=("${META_FILES[@]}")
else
  IFS=',' read -ra INDICES <<< "$selection"
  for idx in "${INDICES[@]}"; do
    idx=$((idx - 1))
    if [ $idx -ge 0 ] && [ $idx -lt ${#META_FILES[@]} ]; then
      scripts_to_release+=("${META_FILES[$idx]}")
    fi
  done
fi

if [ ${#scripts_to_release[@]} -eq 0 ]; then
  echo -e "${RED}No scripts selected.${NC}"
  exit 1
fi

echo ""
echo "Bump type:"
echo "  1. patch (0.0.X) - Bug fixes, small changes"
echo "  2. minor (0.X.0) - New features, non-breaking"
echo "  3. major (X.0.0) - Breaking changes"
echo ""
read -p "Select bump type [1-3]: " bump_choice

case $bump_choice in
  1) bump_type="patch" ;;
  2) bump_type="minor" ;;
  3) bump_type="major" ;;
  *)
    echo -e "${RED}Invalid choice.${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${YELLOW}Releasing:${NC}"
updated_scripts=()
for meta_file in "${scripts_to_release[@]}"; do
  script_name=$(basename $(dirname "$meta_file"))
  current_version=$(get_version "$meta_file")
  new_version=$(bump_version "$current_version" "$bump_type")

  echo "  - $script_name: v$current_version → v$new_version"
  updated_scripts+=("$script_name:$new_version")
done

echo ""
read -p "Proceed? [y/N]: " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Update versions
echo ""
echo -e "${GREEN}Updating versions...${NC}"
for meta_file in "${scripts_to_release[@]}"; do
  script_name=$(basename $(dirname "$meta_file"))
  current_version=$(get_version "$meta_file")
  new_version=$(bump_version "$current_version" "$bump_type")

  update_version "$meta_file" "$new_version"
  echo "  ✓ Updated $script_name to v$new_version"
done

# Rebuild
echo ""
echo -e "${GREEN}Rebuilding dist files...${NC}"
npm run build

# Commit
echo ""
echo -e "${GREEN}Committing changes...${NC}"

# Build commit message
commit_msg="release: bump version"
for item in "${updated_scripts[@]}"; do
  commit_msg="$commit_msg"$'\n'"- $item"
done
commit_msg="$commit_msg"$'\n\n'"Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git add src/ dist/
git commit -m "$commit_msg"

echo ""
echo -e "${GREEN}✓ Release complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the commit: git show"
echo "  2. Push to remote: git push"
