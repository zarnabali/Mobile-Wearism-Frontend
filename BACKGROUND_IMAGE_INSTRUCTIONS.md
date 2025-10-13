# Background Image Setup Instructions

## How to Add Your Background Image

To add a background image to your app, follow these steps:

1. **Add your background image file** to the `assets` folder
2. **Name the file** `background.jpg` (or update the code to use your preferred filename)
3. **Recommended image specifications:**
   - Format: JPG or PNG
   - Resolution: 1080x1920 (9:16 aspect ratio for mobile)
   - File size: Keep under 2MB for optimal performance

## Current Setup

The app is currently configured to:
- **Try to load** `assets/background.jpg` as the background image
- **Fallback to gradient** if the image file is not found
- **Use the same background** across all screens (splash, login, signup)

## To Change the Background Image

1. Replace the file `assets/background.jpg` with your desired image
2. Or modify the `BackgroundImage.tsx` component to use a different filename

## Layout Changes Made

✅ **Content moved to bottom** - All main content (slogan, features, buttons) now appears at the bottom of the screen
✅ **App name at top** - "Toolvio" branding remains at the top
✅ **Consistent layout** - Same layout applied to splash, login, and signup screens
✅ **Background image ready** - Component will automatically use your image when added

The app will work perfectly with the gradient background until you add your custom image!
