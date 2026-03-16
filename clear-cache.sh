#!/bin/bash
# Bash script to clear all caches for Expo/React Native
echo "Clearing all caches..."

# Clear Metro bundler cache
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✓ Cleared node_modules/.cache"
fi

# Clear Expo cache
if [ -d ".expo" ]; then
    rm -rf .expo
    echo "✓ Cleared .expo directory"
fi

# Clear watchman cache (if installed)
if command -v watchman &> /dev/null; then
    watchman watch-del-all
    echo "✓ Cleared watchman cache"
fi

# Clear npm cache
npm cache clean --force
echo "✓ Cleared npm cache"

# Clear Android build cache
if [ -d "android/app/build" ]; then
    rm -rf android/app/build
    echo "✓ Cleared Android build cache"
fi

# Clear iOS build cache
if [ -d "ios/build" ]; then
    rm -rf ios/build
    echo "✓ Cleared iOS build cache"
fi

echo ""
echo "All caches cleared! Now run: npm start"




