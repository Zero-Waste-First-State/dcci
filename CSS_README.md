# CSS & Styling Guide

## Styling Architecture in the DCCI Application

The DCCI Composting Application uses a modern CSS architecture combining **Tailwind CSS** for utility-first styling and **shadcn/ui** components for consistent, accessible UI elements. This approach provides rapid development, maintainable code, and excellent user experience.

## Styling Stack

The DCCI application uses a layered styling approach:

- **Base Layer**: Tailwind CSS utilities + Global styles with DCCI custom colors
- **Component Layer**: shadcn/ui components + Custom component styling
- **Animation Layer**: Framer Motion for page transitions and interactions

## Tailwind CSS Configuration

### Configuration File
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  // Tell Tailwind where to look for classes in your code
  // This helps with purging unused CSS in production
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",      // All files in pages directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // All files in components directory
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // All files in app directory (Next.js App Router)
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for DCCI - extends Tailwind's default colors
        // These can be used as bg-earthyBrown, text-earthyBlue, etc.
        earthyBrown: "#8B4513",      // Primary brown for headers and accents
        earthyBlue: "#4682B4",       // Secondary blue for highlights and buttons
        earthyLightGreen: "#90EE90", // Success states and positive actions
        earthyLightBrown: "#D2B48C", // Backgrounds and subtle elements
      },
      fontFamily: {
        // Override default sans-serif font stack
        // Inter is loaded from Google Fonts in the layout
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [], // Add Tailwind plugins here if needed (e.g., forms, typography)
}

export default config
```

### Custom Color Palette
The DCCI application uses a custom color palette that reflects the composting and environmental theme:

- **earthyBrown** (`#8B4513`): Primary brown for headers and accents
- **earthyBlue** (`#4682B4`): Secondary blue for highlights
- **earthyLightGreen** (`#90EE90`): Success states and positive actions
- **earthyLightBrown** (`#D2B48C`): Backgrounds and subtle elements

## Global Styles

### CSS Variables
```css
/* app/globals.css */
:root {
  /* HSL color values for shadcn/ui components */
  /* These use HSL format: hue saturation% lightness% */
  --background: 0 0% 100%;           /* Pure white background */
  --foreground: 222.2 84% 4.9%;     /* Dark gray text */
  --primary: 222.2 47.4% 11.2%;     /* Dark blue primary color */
  --primary-foreground: 210 40% 98%; /* Light text on primary */
  --secondary: 210 40% 96%;          /* Light gray secondary */
  --secondary-foreground: 222.2 47.4% 11.2%; /* Dark text on secondary */
  --muted: 210 40% 96%;              /* Muted background */
  --muted-foreground: 215.4 16.3% 46.9%; /* Muted text color */
  --accent: 210 40% 96%;             /* Accent background */
  --accent-foreground: 222.2 47.4% 11.2%; /* Accent text */
  --destructive: 0 84.2% 60.2%;      /* Red for errors/danger */
  --destructive-foreground: 210 40% 98%; /* Light text on destructive */
  --border: 214.3 31.8% 91.4%;       /* Light gray borders */
  --input: 214.3 31.8% 91.4%;        /* Input field background */
  --ring: 222.2 84% 4.9%;            /* Focus ring color */
  --radius: 0.5rem;                  /* Default border radius */
}
```

### Base Styles
```css
/* Global base styles */
* {
  /* Apply consistent border color to all elements */
  border-color: hsl(var(--border));
}

body {
  /* Set default text and background colors using CSS variables */
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  /* Enable advanced font features for better typography */
  font-feature-settings: "rlig" 1, "calt" 1;
}

/* Custom scrollbar styling for webkit browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px; /* Make scrollbar thinner */
}

::-webkit-scrollbar-track {
  /* Background color of the scrollbar track */
  background: hsl(var(--muted));
}

::-webkit-scrollbar-thumb {
  /* Color of the scrollbar handle */
  background: hsl(var(--muted-foreground));
  border-radius: 4px; /* Rounded corners for the handle */
}
```

## Component Styling Patterns

### shadcn/ui Components
The application uses shadcn/ui components as the foundation for consistent UI elements:

```typescript
// components/ui/button.tsx
import { cn } from "@/lib/utils" // Utility function to merge Tailwind classes

// Define button variants and sizes for consistent styling
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base button styles - applied to all variants
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          // Focus styles for accessibility
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Disabled state styles
          "disabled:pointer-events-none disabled:opacity-50",
          // Dynamic styles based on variant and size props
          variants[variant], // e.g., "bg-primary text-primary-foreground"
          sizes[size],       // e.g., "h-10 px-4 py-2"
          className          // Allow custom classes to be passed in
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Custom Component Styling
```typescript
// components/dashboard-sidebar.tsx
export default function DashboardSidebar() {
  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Sidebar container: full height, fixed width, white background, right border */}
      
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        {/* Header section: fixed height, centered content, bottom border */}
        <h1 className="text-xl font-semibold text-gray-900">DCCI Dashboard</h1>
        {/* Large, bold text for the dashboard title */}
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Navigation: takes remaining space, vertical spacing between items */}
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            /* Navigation links: flex layout, padding, rounded corners, hover effects */
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
```

## Responsive Design

### Mobile-First Approach
The DCCI application follows a **mobile-first design philosophy**, ensuring that all interfaces work seamlessly across devices from mobile phones to desktop computers. This approach prioritizes the mobile experience while progressively enhancing for larger screens.

```typescript
// Responsive grid layout - starts with 1 column, expands on larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* grid-cols-1: 1 column on mobile (default) */}
  {/* md:grid-cols-2: 2 columns on medium screens (768px+) */}
  {/* lg:grid-cols-3: 3 columns on large screens (1024px+) */}
  {/* gap-6: consistent spacing between grid items */}
  
  <div className="bg-white rounded-lg shadow p-6">
    {/* Card styling: white background, rounded corners, shadow, padding */}
    <h3 className="text-lg font-semibold mb-4">Card Title</h3>
    {/* Large, bold text with bottom margin */}
    <p className="text-gray-600">Card content</p>
    {/* Gray text for content */}
  </div>
</div>

// Responsive text sizing - scales up on larger screens
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  {/* text-2xl: 24px on mobile */}
  {/* md:text-3xl: 30px on medium screens */}
  {/* lg:text-4xl: 36px on large screens */}
  Responsive Heading
</h1>

// Responsive spacing - increases padding on larger screens
<div className="p-4 md:p-6 lg:p-8">
  {/* p-4: 16px padding on mobile */}
  {/* md:p-6: 24px padding on medium screens */}
  {/* lg:p-8: 32px padding on large screens */}
  Content with responsive padding
</div>
```

### Mobile-Friendly Design Principles

#### 1. Touch-Friendly Interface
```typescript
// Buttons sized appropriately for touch interaction
<button className="px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl">
  {/* px-6 py-3: 24px horizontal, 12px vertical padding on mobile */}
  {/* md:px-8 md:py-4: 32px horizontal, 16px vertical padding on larger screens */}
  {/* text-lg: 18px font size on mobile, md:text-xl: 20px on larger screens */}
  Touch-Friendly Button
</button>

// Input fields with adequate touch targets
<input className="h-12 md:h-10 px-4 text-base" />
{/* h-12: 48px height on mobile (minimum touch target) */}
{/* md:h-10: 40px height on larger screens (standard) */}
```

#### 2. Responsive Navigation
```typescript
// Mobile-friendly navigation that stacks on small screens
<nav className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
  {/* flex-col: Stack vertically on mobile */}
  {/* sm:flex-row: Horizontal layout on small screens and up */}
  
  <div className="flex gap-3 md:gap-5 items-center">
    <Image src="/logo.jpg" width={32} height={32} className="sm:w-10 sm:h-10" />
    {/* Smaller logo on mobile, larger on desktop */}
    <span className="text-base md:text-lg">DCCI Branding</span>
  </div>
</nav>
```

#### 3. Content Prioritization
```typescript
// Hide less important content on mobile, show on larger screens
<div className="hidden sm:block">
  {/* Hidden on mobile, visible on small screens and up */}
  Secondary Information
</div>

// Show abbreviated content on mobile, full content on desktop
<span className="hidden sm:inline">Full Button Text</span>
<span className="sm:hidden">Short</span>
{/* Full text on desktop, abbreviated on mobile */}
```

#### 4. Mobile-Optimized Forms
```typescript
// Form layouts that work well on mobile
<div className="space-y-4 md:space-y-6">
  {/* Reduced spacing on mobile for better fit */}
  
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
    {/* Stack form elements vertically on mobile */}
    <div className="flex-1">
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" className="w-full" />
    </div>
    <div className="flex-1">
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" className="w-full" />
    </div>
  </div>
</div>
```

### Breakpoint System
- **sm**: 640px and up
- **md**: 768px and up  
- **lg**: 1024px and up
- **xl**: 1280px and up
- **2xl**: 1536px and up

## Animation and Transitions

### Framer Motion Integration
```typescript
// components/AnimatedWrapper.tsx
import { motion } from "framer-motion"

export default function AnimatedWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      // Initial state when component first appears
      initial={{ opacity: 0, y: 20 }}  // Invisible and 20px down
      // Animated state after component mounts
      animate={{ opacity: 1, y: 0 }}   // Fully visible and in position
      // Exit state when component is removed
      exit={{ opacity: 0, y: -20 }}    // Fade out and move up 20px
      // Animation timing and easing
      transition={{ duration: 0.3 }}   // 300ms smooth transition
    >
      {children}
    </motion.div>
  )
}
```

### CSS Transitions
```css
/* Smooth transitions for interactive elements */
.transition-smooth {
  /* Apply smooth transition to all properties */
  /* cubic-bezier(0.4, 0, 0.2, 1) creates a natural easing curve */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  /* Lift effect on hover: move up 2px */
  transform: translateY(-2px);
  /* Add shadow to create depth */
  /* 0 10px 25px: horizontal, vertical, blur radius */
  /* -5px: negative spread to make shadow tighter */
  /* rgba(0, 0, 0, 0.1): black with 10% opacity */
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}
```

## Form Styling

### Input Components
```typescript
// components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base input styling
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          // File input specific styling (for file upload inputs)
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Placeholder text styling
          "placeholder:text-muted-foreground",
          // Focus states for accessibility
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state styling
          "disabled:cursor-not-allowed disabled:opacity-50",
          className // Allow custom classes to be passed in
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Form Layout Patterns
```typescript
// Form container styling
<div className="space-y-6">
  {/* space-y-6: 24px vertical spacing between form sections */}
  
  <div className="space-y-2">
    {/* space-y-2: 8px vertical spacing between label and input */}
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="Enter your email" />
  </div>
  
  <div className="flex items-center space-x-2">
    {/* flex: horizontal layout, items-center: vertically center checkbox and label */}
    {/* space-x-2: 8px horizontal spacing between checkbox and label */}
    <Checkbox id="terms" />
    <Label htmlFor="terms">Accept terms and conditions</Label>
  </div>
  
  <Button type="submit" className="w-full">
    {/* w-full: button takes full width of container */}
    Submit
  </Button>
</div>
```

## Dashboard Styling

### Card Components
```typescript
// Dashboard card styling
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  {/* Card container: white background, rounded corners, subtle shadow, border, padding */}
  
  <div className="flex items-center justify-between mb-4">
    {/* Header: flex layout, space between title and badge, bottom margin */}
    <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
    {/* Large, bold, dark text for the title */}
    <Badge variant="secondary">Status</Badge>
    {/* Status badge with secondary styling */}
  </div>
  
  <p className="text-gray-600">Card content goes here</p>
  {/* Gray text for content description */}
</div>
```

### Table Styling
```typescript
// Data table styling
<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
  {/* Table container: hidden overflow, shadow, ring border, rounded on medium+ screens */}
  
  <table className="min-w-full divide-y divide-gray-300">
    {/* Table: full width, vertical dividers between rows */}
    
    <thead className="bg-gray-50">
      {/* Header: light gray background */}
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {/* Header cell: padding, left-aligned, small text, medium weight, gray color, uppercase, wide letter spacing */}
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
    
    <tbody className="bg-white divide-y divide-gray-200">
      {/* Body: white background, lighter dividers between rows */}
      {/* Table rows go here */}
    </tbody>
  </table>
</div>
```

## Color System

### Semantic Colors
```typescript
// Color usage patterns for consistent button and element styling
const colorClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",     // Main action buttons
  secondary: "bg-gray-600 text-white hover:bg-gray-700",   // Secondary actions
  success: "bg-green-600 text-white hover:bg-green-700",   // Success states, confirmations
  warning: "bg-yellow-600 text-white hover:bg-yellow-700", // Warnings, caution states
  danger: "bg-red-600 text-white hover:bg-red-700",        // Destructive actions, errors
  info: "bg-blue-500 text-white hover:bg-blue-600",        // Informational elements
}
```

### Theme Colors
```typescript
// DCCI-specific color usage for composting/environmental theme
const dcciColors = {
  header: "bg-earthyBrown text-white",        // Main headers and navigation
  accent: "bg-earthyBlue text-white",         // Accent buttons and highlights
  success: "bg-earthyLightGreen text-gray-900", // Success states with dark text for contrast
  background: "bg-earthyLightBrown",          // Subtle background elements
}
```

## Utility Classes

### Common Patterns
```typescript
// Layout utilities for consistent page structure
const layoutClasses = {
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", // Centered container with responsive padding
  section: "py-12 md:py-16 lg:py-20",                   // Section spacing that scales with screen size
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", // Responsive grid layout
  flex: "flex flex-col md:flex-row items-center justify-between", // Responsive flex layout
}

// Spacing utilities for consistent vertical rhythm
const spacingClasses = {
  section: "space-y-6 md:space-y-8", // Large spacing between major sections
  content: "space-y-4",              // Medium spacing between content blocks
  items: "space-y-2",                // Small spacing between related items
}
```

### Custom Utilities
```css
/* Custom utility classes that extend Tailwind's default utilities */
@layer utilities {
  .text-balance {
    /* Modern CSS property for better text wrapping */
    /* Distributes text more evenly across lines */
    text-wrap: balance;
  }
  
  .scrollbar-hide {
    /* Hide scrollbars across different browsers */
    -ms-overflow-style: none;  /* Internet Explorer and Edge */
    scrollbar-width: none;     /* Firefox */
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    /* Hide scrollbar in WebKit browsers (Chrome, Safari, newer Edge) */
    display: none;
  }
}
```

## Performance Optimizations

### CSS Optimization
- **Purge unused CSS**: Tailwind automatically purges unused styles
- **Critical CSS**: Inline critical CSS for above-the-fold content
- **CSS minification**: Automatic CSS minification in production
- **Tree shaking**: Remove unused CSS rules

### Loading Strategies
```typescript
// Font loading optimization with Next.js
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],        // Only load Latin character subset
  display: 'swap',          // Use font-display: swap for better performance
  variable: '--font-inter', // Create CSS variable for the font
})

// Apply font to root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* Apply the font variable to the HTML element */}
      <body className="font-sans">{children}</body>
      {/* font-sans uses the Inter font via CSS variable */}
    </html>
  )
}
```

## Accessibility

### Focus Management
```css
/* Focus styles for accessibility */
.focus-visible:outline-none {
  /* Remove default browser outline */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus-visible:ring-2 {
  /* Add custom focus ring using box-shadow */
  /* 0 0 0: no offset, no blur, no spread */
  /* 2px: ring thickness */
  /* hsl(var(--ring)): ring color from CSS variable */
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
```

### Color Contrast
- **Text contrast**: Minimum 4.5:1 ratio for normal text
- **Large text**: Minimum 3:1 ratio for large text
- **Interactive elements**: Clear visual feedback for all states

### Screen Reader Support
```typescript
// Accessible form labels
<Label htmlFor="email" className="sr-only">
  {/* sr-only: visually hidden but available to screen readers */}
  Email Address
</Label>
<Input id="email" type="email" aria-describedby="email-error" />
{/* aria-describedby: links input to error message for screen readers */}

// Accessible button states
<Button 
  aria-pressed={isPressed}        // Indicates if button is pressed/toggled
  aria-expanded={isExpanded}      // Indicates if dropdown/menu is open
  aria-describedby="button-description" // Links to descriptive text
>
  Toggle Menu
</Button>
```

## Best Practices

### CSS Organization
- **Utility-first**: Use Tailwind utilities over custom CSS
- **Component-based**: Keep styles close to components
- **Consistent naming**: Use consistent class naming patterns
- **Responsive design**: Mobile-first approach

### Performance
- **Minimize custom CSS**: Use Tailwind utilities when possible
- **Optimize images**: Use Next.js Image component
- **Lazy load**: Implement lazy loading for non-critical styles
- **Bundle analysis**: Regularly check CSS bundle size

### Maintenance
- **Document custom styles**: Comment complex CSS patterns
- **Version control**: Track changes to styling
- **Testing**: Test across different devices and browsers
- **Refactoring**: Regularly refactor and optimize styles

## Troubleshooting

### Common Issues
- **Style conflicts**: Use CSS specificity or `!important` sparingly
- **Responsive issues**: Test on actual devices, not just browser dev tools
- **Performance**: Monitor CSS bundle size and loading times
- **Accessibility**: Use accessibility testing tools

### Debugging Tools
- **Browser DevTools**: Inspect and modify styles in real-time
- **Tailwind CSS IntelliSense**: VS Code extension for autocomplete
- **CSS Validator**: Validate CSS syntax and best practices
- **Lighthouse**: Performance and accessibility auditing

## Resources

### Documentation
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Next.js Styling Guide](https://nextjs.org/docs/basic-features/built-in-css-support)

### Tools
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Tailwind UI](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)

---

**Last Updated**: December 2024  
**Tailwind Version**: 3.x  
**shadcn/ui**: Latest
