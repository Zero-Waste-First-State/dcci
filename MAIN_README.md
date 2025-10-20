# DCCI Composting Application

## Project Overview

The DCCI (Delaware Center for Composting Innovation) Composting Application is a comprehensive web-based system for managing community composting operations across multiple sites in Delaware. DCCI is part of [Plastic Free Delaware's](https://plasticfreedelaware.org) Community Composting initiative, which works toward a First State free of single-use plastic pollution and steeped in circularity.

The application consists of two main interfaces:

- **Public User Forms**: For volunteers and community members to log composting activities at DCCI sites
- **Staff Dashboard**: For DCCI staff to monitor, manage, and analyze composting data across all community sites

## System Architecture

### Application Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Application                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend Interfaces                                        │
│  ┌─────────────────┐              ┌─────────────────┐      │
│  │   User Forms    │              │ Staff Dashboard │      │
│  │                 │              │                 │      │
│  │ • Site Selection│              │ • Data Tables   │      │
│  │ • Task Forms    │              │ • Reports       │      │
│  │ • Data Entry    │              │ • Analytics     │      │
│  │ • Submission    │              │ • Management    │      │
│  └─────────────────┘              └─────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Backend Services                                           │
│  ┌─────────────────┐              ┌─────────────────┐      │
│  │   Next.js API   │              │    Supabase     │      │
│  │                 │              │                 │      │
│  │ • Auth Routes   │              │ • PostgreSQL DB │      │
│  │ • Form Handling │              │ • Authentication│      │
│  │ • Middleware    │              │ • File Storage  │      │
│  │ • Route Protection│            │ • Real-time     │      │
│  └─────────────────┘              └─────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technical Stack
- **Frontend Framework**: Next.js 15 with App Router
- **Backend Services**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

### Key Features

**User Forms:**
- Multi-step form system for logging composting activities
- Site selection with optional password protection
- Task-specific forms (adding material, measurements, moving bins, etc.)
- Data persistence across page navigation
- Contamination and issue reporting
- **Mobile-optimized interface** for on-site data collection

**Staff Dashboard:**
- Real-time activity monitoring
- Comprehensive data tables and analytics
- PDF report generation (DNREC compliance)
- Site and user management
- Email alert system for issues and contamination
- **Desktop-focused design** for detailed data management

**Backend Infrastructure:**
- PostgreSQL database with Row Level Security
- Email-based authentication for staff
- File storage for PDF reports
- Real-time data synchronization
- Automated email notifications

**Mobile-Friendly Design:**
- **Responsive layouts** that work seamlessly across all devices
- **Touch-optimized interface** with appropriately sized buttons and inputs
- **Mobile-first approach** for user forms (primary use case)
- **Progressive enhancement** for larger screens
- **Accessibility features** including mobile accessibility standards

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dcci-h4i
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Public forms: `http://localhost:3000/compost-form`
   - Staff dashboard: `http://localhost:3000/dashboard`
   - Home page: `http://localhost:3000`

## Documentation

### 📚 Complete Documentation Suite

| Document | Purpose | Audience |
|----------|---------|----------|
| **[NEXTJS_README.md](./NEXTJS_README.md)** | Next.js architecture, App Router, and development patterns | Developers working on the application framework |
| **[VERCEL_README.md](./VERCEL_README.md)** | Deployment, hosting, and Vercel platform configuration | Developers and system administrators |
| **[CSS_README.md](./CSS_README.md)** | Styling architecture, Tailwind CSS, and UI components | Frontend developers and designers |
| **[USER_FORM_README.md](./USER_FORM_README.md)** | User form system architecture, components, and data flow | Developers working on form functionality |
| **[DASHBOARD_README.md](./DASHBOARD_README.md)** | Staff dashboard features, components, and management | Developers and staff using the dashboard |
| **[SUPABASE_README.md](./SUPABASE_README.md)** | Database setup, management, and Supabase configuration | Developers and system administrators |
| **[EMAIL_README.md](./EMAIL_README.md)** | Email system, notifications, and Resend integration | Developers and system administrators |
| **[DNS.md](./DNS.md)** | Email configuration and domain setup | System administrators |

### 🎯 When to Use Each Document

**For Application Framework Development:**
- Start with `NEXTJS_README.md` for understanding Next.js architecture and patterns
- Reference this `MAIN_README.md` for overall project structure

**For Frontend Development:**
- Start with `CSS_README.md` for styling architecture and UI components
- Reference `NEXTJS_README.md` for component patterns and routing
- Use `VERCEL_README.md` for deployment and performance optimization

**For Form Development:**
- Start with `USER_FORM_README.md` for understanding the multi-step form system
- Reference `NEXTJS_README.md` for Next.js routing and component patterns
- Reference `CSS_README.md` for form styling and responsive design
- Reference `SUPABASE_README.md` for database schema and data flow

**For Dashboard Development:**
- Start with `DASHBOARD_README.md` for dashboard components and features
- Reference `NEXTJS_README.md` for App Router and API routes
- Reference `CSS_README.md` for dashboard styling and layout
- Reference `SUPABASE_README.md` for data management and RLS policies

**For Deployment and DevOps:**
- Use `VERCEL_README.md` for deployment configuration and monitoring
- Reference `SUPABASE_README.md` for database management and user administration
- Reference `EMAIL_README.md` for email system configuration and troubleshooting
- Reference `DNS.md` for email configuration and domain setup

**For New Developers:**
- Read this `MAIN_README.md` first for project overview
- Read `NEXTJS_README.md` for framework understanding
- Read `CSS_README.md` for styling approach
- Then dive into specific documentation based on your focus area

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations and transitions
- **shadcn/ui** - Component library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - File storage
  - Real-time subscriptions
  - Edge Functions

### Deployment
- **Vercel** - Frontend hosting
- **Custom Domain** - h4i.plasticfreedelaware.org
- **Email Service** - AWS SES via Resend

## Project Structure

```
dcci-h4i/
├── app/                          # Next.js App Router pages
│   ├── compost-form/            # Public user forms
│   ├── dashboard/               # Staff dashboard
│   ├── auth/                    # Authentication pages
│   └── api/                     # API routes
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   └── tutorial/                # Onboarding components
├── lib/                         # Utility functions
│   ├── supabase/               # Supabase client configuration
│   ├── email.ts                # Email utilities
│   └── utils.ts                # General utilities
├── supabase/                    # Supabase configuration
│   └── functions/              # Edge Functions
└── public/                      # Static assets
```

## Key Workflows

### User Form Submission Flow
1. **Site Selection** → User selects composting site
2. **Task Selection** → User enters name/email and selects task
3. **Task Form** → User fills out task-specific data
4. **Additional Tasks** → Optional additional information
5. **Litter Page** → Contamination reporting
6. **Issue Corner** → Problem reporting
7. **Submit** → Final review and submission
8. **Thank You** → Confirmation page

### Staff Dashboard Workflow
1. **Login** → Staff authenticates via email/password
2. **Dashboard Home** → Overview of recent activity and alerts
3. **Data Tables** → View and manage specific data types
4. **Reports** → Generate PDF reports and manage documents
5. **Settings** → Manage sites, users, and email recipients

## Development Guidelines

### Code Organization
- **Pages**: Use Next.js App Router structure
- **Components**: Keep components focused and reusable
- **Types**: Define TypeScript interfaces for data structures
- **Styling**: Use Tailwind CSS classes consistently

### Data Management
- **Form Data**: Use hybrid approach (URL parameters + localStorage)
- **Database**: Follow Supabase best practices with RLS
- **Real-time**: Use Supabase real-time for live updates

### Security
- **Authentication**: Email/password with Supabase Auth
- **Authorization**: Row Level Security policies
- **Data Protection**: Encrypted storage and secure API keys

## Deployment

### Production Environment
- **Frontend**: Deployed on Vercel
- **Domain**: h4i.plasticfreedelaware.org
- **Database**: Supabase hosted PostgreSQL
- **Email**: AWS SES configuration

### Environment Variables
```env
# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Support and Maintenance

### Monitoring
- **Supabase Dashboard**: Monitor database performance and usage
- **Vercel Dashboard**: Monitor frontend performance and deployments
- **Email Logs**: Monitor email delivery and authentication

### Regular Maintenance
- **Database Cleanup**: Remove old submissions periodically
- **User Management**: Review and update staff access
- **Security Updates**: Keep dependencies updated
- **Backup Verification**: Ensure data backups are working

## Getting Help

### For Developers
- Check the specific README files for detailed documentation
- Review the codebase for examples and patterns
- Use TypeScript for better development experience

### For System Administrators
- Reference `SUPABASE_README.md` for database management
- Check `DNS.md` for email and domain configuration
- Monitor usage and costs in Supabase dashboard

### For Staff Users
- Reference `DASHBOARD_README.md` for dashboard features
- Contact system administrator for access issues
- Use the built-in help and tutorial features

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: DCCI Development Team
