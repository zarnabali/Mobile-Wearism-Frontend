# Mobile-Wearism UI/UX Documentation

This document serves as the primary source of truth for styling, structuring, and maintaining a consistent user experience in the Mobile-Wearism project.

## 1. Typography & Fonts

The project uses **Helvetica Neue** exclusively to maintain a premium, high-fashion aesthetic. Custom font variants are loaded in [app/_layout.tsx](file:///Users/oooo/Dev/fyp/Mobile-Wearism-Frontend/app/_layout.tsx) and mapped to Tailwind-like utility classes in [global.css](file:///Users/oooo/Dev/fyp/Mobile-Wearism-Frontend/global.css).

### Font Variants Table
| Style | Project Name (Loaded) | Tailwind Utility Class | Usage |
| :--- | :--- | :--- | :--- |
| **Thin** | `HelveticaNeue-Thin` | `.font-thin` | Minimalist headers, accents |
| **UltraLight** | `HelveticaNeue-UltraLight` | `.font-extralight` | Sophisticated secondary text |
| **Light** | `HelveticaNeue-Light` | `.font-light` | Main brand headers (e.g. "Wearism") |
| **Roman** | `HelveticaNeue-Roman` | `.font-normal` | Body text, captions |
| **Medium** | `HelveticaNeue-Medium` | `.font-medium` | Form labels, small interactive text |
| **Heavy** | `HelveticaNeue-Heavy` | `.font-semibold` | Primary buttons, important labels |
| **Bold** | `HelveticaNeue-Bold` | `.font-bold` | Section headers, user names |
| **Black** | `HelveticaNeue-Black` | `.font-extrabold` / `.font-black` | High-impact CTAs |

> [!IMPORTANT]
> **Always** apply the `font-family` manually in the `style` prop if the `className` doesn't pick it up correctly in some NativeWind versions, especially for headers:
> `style={{ fontFamily: 'HelveticaNeue-Bold' }}`

---

## 2. Color Palette & Theming

The app follows a sleek, dark aesthetic with high-contrast accents.

### Core Colors
*   **Primary Accent**: `#FF6B35` (Vibrant Orange) - Used for buttons, active icons, badges, and primary borders.
*   **Background Base**: `#000000` (Pure Black).
*   **Gradient Accent**: `rgba(60, 0, 8, 0.45)` (Deep Burgundy) - Used in backgrounds to create depth.
*   **Text (Primary)**: `#FFFFFF` (White).
*   **Text (Secondary)**: `rgba(255, 255, 255, 0.6)` to `0.8`.
*   **Error/Warning**: `text-orange-400` (consistent with theme).

### Use of Gradients
We use `LinearGradient` from `expo-linear-gradient` for global background depth:
```tsx
<LinearGradient
  colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
  style={{ flex: 1 }}
>
```

---

## 3. Component Library Patterns

### A. Glassmorphism Design
Used for high-priority containers like login forms and ads.
*   **Background**: `bg-black/40` or `bg-white/10`.
*   **Blur**: `backdrop-blur-sm`.
*   **Border**: `border border-white/20` or `border border-orange-500/30`.
*   **Corner Radius**: `rounded-2xl` (16px - 20px).

### B. Interactive Buttons
Buttons should be rounded and use high-contrast text.
```tsx
{/* Primary Action Button */}
<TouchableOpacity 
  className="bg-[#FF6B35] py-4 rounded-full"
  activeOpacity={0.8}
>
  <Text className="text-white text-center text-lg font-semibold" style={{ fontFamily: 'HelveticaNeue-Heavy' }}>
    SIGN UP
  </Text>
</TouchableOpacity>

{/* Secondary Outline Button */}
<TouchableOpacity 
  className="bg-white/10 rounded-xl px-4 py-3 border border-white/20"
  activeOpacity={0.7}
>
  <Text className="text-white">View More</Text>
</TouchableOpacity>
```

### C. Form Inputs
Inputs use a standardized "pill" or "rounded-xl" look with icons.
*   **Container**: `bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20`.
*   **Icons**: Use `Ionicons` with color `#FF6B35`.
*   **Placeholder**: `rgba(255,255,255,0.6)`.

### D. Cards (Product & Social)
*   **Feed Cards**: Use a Full-width or semi-full-width approach with a header (Avatar + Name) and bottom actions (Like, Comment, Share).
*   **Vendor Ad Cards**: Distinguishable by the `SPONSORED` label and orange-tinted borders (`border-orange-500/30`).
*   **Product Cards (Grid)**: Used in inventory and search. 
    *   **Badges**: `Trending` (Flame icon, orange), `Stock` (Green for high stock, Amber for low).
    *   **Price**: Large `HelveticaNeue-Thin` for a luxury feel.
*   **Image Handling**: Use `ImageBackground` for overlays or `Image` with standard aspect ratios (usually square or 4:5).

### E. Advanced Components
*   **ImageCarousel**: Used for high-impact landing pages. 
    *   **Pattern**: Synchronized dual-scrolling (Background image + Foreground text).
    *   **Overlay**: Uses a specific burgundy gradient overlay to ensure text legibility.
*   **StoriesStrip**: Standard Instagram-style horizontal strip.
    *   **Border**: Uses a `LinearGradient` border. Orange/Burgundy for new stories, White/Grey for seen stories.
    *   **Your Story**: Uses a dashed border (`borderStyle: 'dashed'`) with an add icon.

---

## 4. Navigation & Layout

### Global Layout
The app is built on **Expo Router**.
*   **Root Provider**: [app/_layout.tsx](file:///Users/oooo/Dev/fyp/Mobile-Wearism-Frontend/app/_layout.tsx) wraps the app in `VendorProvider` and handles font loading.
*   **SafeArea**: Every screen must use `SafeAreaView` from `react-native-safe-area-context` to handle notches and home indicators.
*   **Stack Navigation**: Screens are declared as `Stack.Screen` in the root layout.

### Shared Navigation Components
*   **BottomNav**: Main navigation for the consumer app (Home, Feed, Wardrobe, Messages, Profile).
*   **VendorNav**: Specialized navigation for vendors (Dashboard, Inventory, Ads, Analytics).

### Vendor UI Patterns
*   **Metrics Cards**: Used in Dashboards. Simple `rounded-2xl` tiles with `HelveticaNeue-Thin` numbers and clear labels.
*   **Section Headers**: Use `HelveticaNeue-Bold` for clarity in administrative interfaces.
*   **Inventory Lists**: Concise rows with product thumbnails, stock counts, and status indicators (`Active`/`Inactive` dot).

---

## 5. Visual Consistency & FX

1.  **Iconography**: Standardize on `Ionicons`. Use `@expo/vector-icons`.
2.  **Shadows**: We prefer depth via gradients and borders rather than heavy native shadows for the "luxury" feel.
3.  **Active State**: Always use `activeOpacity` (0.7 for secondary, 0.8 for primary) to provide visual feedback.
4.  **Transitions**: Use `react-native-reanimated` for complex animations (stories, transitions).

---

## 6. Best Practices Checklist

- [ ] Always wrap content in `SafeAreaView`.
- [ ] Use `font-family` styles for all text elements to ensure Helvetica Neue is used.
- [ ] Use `Ionicons` with `#FF6B35` for active/accent states.
- [ ] Keep `ScrollView` padding high at the bottom (`paddingBottom: 100`) to avoid being covered by `BottomNav`.
- [ ] Use `backdrop-blur` for overlays on images to maintain readability.
- [ ] Maintain the `active` prop in shared nav components when adding new routes.
