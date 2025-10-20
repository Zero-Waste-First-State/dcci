# Next.js Architecture & Development Guide

## Next.js in the DCCI Application

The DCCI Composting Application is built on **Next.js 15** with the **App Router**, providing a modern, full-stack React framework that handles both frontend and backend functionality in a single codebase.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Application                   │
├─────────────────────────────────────────────────────────────┤
│  App Router Structure                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Public Pages  │  │  Dashboard      │  │   Auth       │ │
│  │                 │  │                 │  │              │ │
│  │ • /             │  │ • /dashboard    │  │ • /auth/login│ │
│  │ • /compost-form │  │ • /dashboard/*  │  │ • /auth/*    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Backend)                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Auth API      │  │   DNREC API     │  │  Submissions │ │
│  │                 │  │                 │  │              │ │
│  │ • /api/auth/*   │  │ • /api/dnrec/*  │  │ • /api/*     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Middleware & Utilities                                     │
│  • Authentication middleware                               │
│  • Route protection                                        │
│  • Supabase client configuration                           │
└─────────────────────────────────────────────────────────────┘
```

## App Router Structure

### DCCI Page Organization

```
app/
├── page.tsx                    # Home page (/) - DCCI landing page
├── layout.tsx                  # Root layout with global styles
├── globals.css                 # DCCI custom colors and styles
├── compost-form/               # Public user forms for composting activities
│   ├── page.tsx               # Site selection (/compost-form)
│   ├── layout.tsx             # Form-specific layout with overscroll prevention
│   ├── task-selection/        # Task selection (adding material, measuring, etc.)
│   │   ├── adding-material/   # Adding greens/browns to bins
│   │   ├── measuring-bin/     # Temperature and moisture measurements
│   │   ├── moving-bins/       # Bin movement operations
│   │   └── finished-compost/  # Finished compost collection
│   ├── additional-tasks/      # Additional task information
│   ├── litter-page/           # Contamination reporting
│   ├── issue-corner/          # Problem reporting (tools, odors, pests)
│   ├── submit/                # Final submission with data validation
│   └── thank-you/             # Success confirmation page
├── dashboard/                  # Staff dashboard for DCCI management
│   ├── page.tsx               # Dashboard home with activity panels
│   ├── layout.tsx             # Dashboard layout with sidebar navigation
│   ├── reports/               # DNREC report generation and PDF management
│   ├── log/                   # Form submissions table with filtering
│   ├── settings/              # Site management and email recipients
│   ├── adding-material/       # Adding material data table
│   ├── measurements/          # Measurements data table
│   ├── moving-bins/           # Moving bins data table
│   ├── finished-compost/      # Finished compost data table
│   ├── issues/                # Issues data table
│   ├── contamination/         # Contamination data table
│   └── browns-bin/            # Browns bin data table
├── auth/                      # Authentication for staff access
│   ├── login/                 # Staff login page
│   ├── sign-up/               # User registration (if needed)
│   ├── forgot-password/       # Password reset functionality
│   ├── update-password/       # New password setup
│   └── confirm/               # Email confirmation handling
└── api/                       # API routes for backend functionality
    ├── auth/                  # Authentication endpoints (logout)
    ├── dnrec/                 # DNREC report generation and PDF handling
    └── submissions/           # Form submission processing
```

## Key Next.js Features Used

### 1. App Router
- **File-based routing**: Pages are created by adding files to the `app` directory
- **Nested layouts**: Each route can have its own layout component
- **Loading states**: Built-in loading.tsx files for better UX
- **Error boundaries**: error.tsx files for error handling

### 2. Server and Client Components
- **Server Components**: Default for pages, run on the server
- **Client Components**: Use `"use client"` directive for interactivity
- **Hybrid approach**: Mix server and client components as needed

### 3. API Routes
- **Route handlers**: API endpoints in `app/api/` directory
- **HTTP methods**: GET, POST, PUT, DELETE support
- **Middleware integration**: Authentication and validation

### 4. Middleware
- **Authentication**: Protects routes and manages sessions
- **Route protection**: Redirects based on authentication status
- **Request/Response processing**: Modifies requests before they reach pages

## Component Architecture

### Component Organization

```
components/
├── ui/                        # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── [feature-components]/      # Feature-specific components
│   ├── adding-material.tsx
│   ├── measuring-bin.tsx
│   ├── dashboard-sidebar.tsx
│   └── ...
    └── ...
```

### Component Patterns

**Server Components (Default)**
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return <DashboardContent user={user} />
}
```

**Client Components**
```typescript
// components/adding-material.tsx
"use client"

import { useState, useEffect } from 'react'

export default function AddingMaterial() {
  const [formData, setFormData] = useState({})
  
  // Client-side interactivity
  return <form>...</form>
}
```

## API Routes

### Authentication API
```typescript
// app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
```

### Form Submission API
```typescript
// app/api/submissions/auto-delete/route.ts
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  // Handle form submission logic
  return NextResponse.json({ success: true })
}
```

## Middleware Configuration

### Authentication Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Check authentication for protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }
  
  return res
}
```

## Data Fetching Patterns

### Server-Side Data Fetching
```typescript
// Server Component - runs on server
async function getFormSubmissions() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Form Submission')
    .select('*')
    .order('timestamp', { ascending: false })
  
  if (error) throw error
  return data
}
```

### Client-Side Data Fetching
```typescript
// Client Component - runs in browser
"use client"

function useFormSubmissions() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/submissions')
      const result = await response.json()
      setData(result)
    }
    fetchData()
  }, [])
  
  return data
}
```

## Styling and UI

### Tailwind CSS Integration
- **Utility-first**: Consistent styling with Tailwind classes
- **Responsive design**: Mobile-first approach with comprehensive breakpoint system
- **Component styling**: Combined with shadcn/ui components

### Mobile-First Responsive Design
The DCCI application prioritizes mobile users, as many composting volunteers use mobile devices while at sites:

```typescript
// Mobile-first responsive patterns used throughout the app
<div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
  {/* flex-col: Stack vertically on mobile (default) */}
  {/* md:flex-row: Switch to horizontal layout on medium screens (768px+) */}
  {/* gap-4: Smaller gaps on mobile, md:gap-6: larger gaps on desktop */}
</div>

// Responsive typography that scales appropriately
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  {/* text-2xl: 24px on mobile */}
  {/* sm:text-3xl: 30px on small screens (640px+) */}
  {/* md:text-4xl: 36px on medium screens (768px+) */}
  Responsive Heading
</h1>

// Touch-friendly button sizing
<Button className="px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl">
  {/* px-6 py-3: Adequate touch target on mobile */}
  {/* md:px-8 md:py-4: Larger padding on desktop */}
  {/* text-lg: Readable size on mobile, md:text-xl: larger on desktop */}
  Touch-Friendly Button
</Button>
```

### Breakpoint System
- **sm**: 640px and up (small tablets)
- **md**: 768px and up (tablets)
- **lg**: 1024px and up (laptops)
- **xl**: 1280px and up (desktops)
- **2xl**: 1536px and up (large desktops)

### shadcn/ui Components
- **Pre-built components**: Button, Input, Card, etc.
- **Mobile-optimized**: All components designed with mobile touch targets in mind
- **Customizable**: Easy to modify and extend for responsive behavior
- **Accessible**: Built with accessibility in mind, including mobile accessibility features

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Build for production
npm run build
```

### File Structure Conventions
- **Pages**: `app/[route]/page.tsx`
- **Layouts**: `app/[route]/layout.tsx`
- **Loading**: `app/[route]/loading.tsx`
- **Errors**: `app/[route]/error.tsx`
- **API Routes**: `app/api/[route]/route.ts`

## Performance Optimizations

### Next.js Built-in Features
- **Automatic code splitting**: Only load what's needed
- **Image optimization**: Next.js Image component
- **Font optimization**: Automatic font loading
- **Bundle analysis**: Built-in bundle analyzer

### Custom Optimizations
- **Component lazy loading**: Dynamic imports for heavy components
- **Data caching**: Supabase client caching
- **Route prefetching**: Automatic prefetching of linked routes

## Deployment

### Vercel Integration
- **Automatic deployments**: Git-based deployments
- **Environment variables**: Secure configuration
- **Edge functions**: Global distribution
- **Analytics**: Built-in performance monitoring

### Build Configuration
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
}

export default nextConfig
```

## Common Patterns

### Form Handling
```typescript
// Server Action pattern
async function submitForm(formData: FormData) {
  'use server'
  
  const supabase = createClient()
  // Process form data
  redirect('/thank-you')
}
```

### Route Protection
```typescript
// Layout-based protection
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
```

### Error Handling
```typescript
// Error boundary
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Debugging Tools
- **Next.js DevTools**: Built-in development tools
- **React DevTools**: Component inspection
- **Network tab**: API request debugging
- **Console logs**: Server and client logging

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Learning Resources
- [Next.js Learn Course](https://nextjs.org/learn)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Last Updated**: December 2024  
**Next.js Version**: 15.0  
**App Router**: Enabled
