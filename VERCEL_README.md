# Vercel Deployment & Configuration Guide

## Vercel in the DCCI Application

The DCCI Composting Application is deployed on **Vercel**, providing seamless Next.js hosting with automatic deployments and global CDN distribution.

## Current Setup

- **Production Domain**: `h4i.plasticfreedelaware.org`
- **Deployment**: Automatic from `main` branch
- **Preview Deployments**: Automatic for pull requests
- **Integration**: Connected to Supabase for backend services

## Domain & DNS

- **Domain**: `h4i.plasticfreedelaware.org`
- **SSL**: Automatically managed by Vercel
- **DNS**: Configured through Vercel's DNS management
- **CDN**: Global edge network for fast loading

## Deployment

### Automatic Deployments
- **Main branch** → Production deployment
- **Pull requests** → Preview deployments
- **Merge PR** → Updates production

### Manual Deployments
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

Configured in Vercel dashboard under Project Settings → Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://h4i.plasticfreedelaware.org
```

**Environment Setup:**
- **Production**: All variables set for live environment
- **Preview**: Same as production (uses production Supabase)
- **Development**: Uses `.env.local` file

## Build Configuration

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  output: 'standalone',
}

export default nextConfig
```

**Build Process:**
1. Install dependencies (`npm install`)
2. TypeScript compilation
3. Build application (`npm run build`)
4. Optimize assets (images, code splitting)
5. Deploy to Vercel's global network

## Performance Features

- **Edge Functions**: Serverless functions at the edge
- **Image Optimization**: Automatic compression and WebP conversion
- **Global CDN**: Content delivered from nearest edge location
- **Code Splitting**: Automatic route-based code splitting
- **Static Generation**: Pre-rendered pages for better performance

## Monitoring & Analytics

- **Core Web Vitals**: Performance metrics monitoring
- **User Analytics**: Page views and user behavior
- **Real User Monitoring**: Actual user experience data
- **Performance Insights**: Detailed performance breakdowns

**Accessing Analytics:**
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Analytics** tab

## Deployment Settings

**Build Settings:**
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

**Function Settings:**
- **Node.js Version**: 18.x (recommended)
- **Memory**: 1024 MB (default)
- **Timeout**: 10 seconds (default)

**Branch Management:**
- **Production**: `main` branch → `h4i.plasticfreedelaware.org`
- **Preview**: All other branches → `https://dcci-h4i-git-[branch]-[team].vercel.app`

## Error Handling & Security

**Build Errors:**
- Build logs available in Vercel dashboard
- Email alerts for failed builds
- Automatic rollback to last successful deployment

**Runtime Errors:**
- Built-in error monitoring
- Function execution logs
- Real-time performance tracking

**Security:**
- Automatic SSL certificates
- HTTP/2 support
- Encrypted environment variables
- Team-based access control

## Troubleshooting

**Build Failures:**
- Check build logs for detailed error messages
- Verify all required environment variables are set
- Ensure dependencies are properly installed
- Fix TypeScript compilation errors

**Deployment Issues:**
- Verify DNS settings
- Check SSL certificate status
- Adjust function timeouts if needed
- Increase memory allocation if required

**Performance Issues:**
- Analyze bundle size and optimize
- Ensure images are properly optimized
- Check CDN caching configuration
- Optimize database queries

## Integration

**Supabase Integration:**
- Environment variables configured in Vercel
- Direct connection to Supabase from Vercel
- Real-time features through Vercel

**Email Services:**
- SMTP configuration through environment variables
- Domain authentication (SPF, DKIM, DMARC)
- Reliable email delivery through Vercel's network

## Cost Management

### Vercel Pricing Breakdown

#### **Hobby Plan (Free)**
**What's Included:**
- **Bandwidth**: 100GB/month
- **Function executions**: 100GB-hours/month
- **Build minutes**: 6,000 minutes/month
- **Team members**: Unlimited
- **Domains**: Unlimited custom domains
- **Deployments**: Unlimited deployments

**Limitations:**
- **No analytics**: Basic analytics only
- **No preview deployments**: Limited to 1,000 preview deployments/month
- **No team features**: No team management or collaboration tools
- **No priority support**: Community support only
- **No advanced security**: Basic security features only

#### **Pro Plan ($20/month per member)**
**What's Included:**
- **Bandwidth**: 1TB/month (10x increase)
- **Function executions**: 1,000GB-hours/month (10x increase)
- **Build minutes**: 6,000 minutes/month (same as Hobby)
- **Team members**: Pay per member
- **Analytics**: Advanced analytics and insights
- **Preview deployments**: Unlimited preview deployments
- **Team features**: Team management, collaboration tools
- **Priority support**: Email support with faster response times
- **Advanced security**: Enhanced security features

**Why the Cost:**
- **Infrastructure scaling**: More bandwidth and compute resources
- **Team collaboration**: Advanced team management features
- **Analytics**: Detailed performance and usage analytics
- **Support**: Dedicated support team
- **Security**: Enhanced security and compliance features

#### **Team Plan ($20/month per member)**
**What's Included:**
- **Everything from Pro Plan**
- **Advanced team features**: Role-based access control
- **Enterprise security**: SSO, audit logs, compliance features
- **Dedicated support**: Phone and email support
- **Custom contracts**: Enterprise-level agreements

**Why the Higher Cost:**
- **Enterprise features**: Advanced security and compliance
- **Dedicated support**: Priority support with faster response times
- **Custom agreements**: Flexible contracts and SLAs
- **Advanced analytics**: Enterprise-level insights and reporting

### Detailed Cost Drivers

#### **Bandwidth Costs**
**What it is:**
- Data transfer between Vercel's CDN and users
- Includes all static assets, API responses, and dynamic content

**Why it costs money:**
- **CDN infrastructure**: Global edge network maintenance
- **Data transfer**: Costs to transfer data across regions
- **Peak traffic handling**: Infrastructure to handle traffic spikes
- **Global distribution**: Multiple data centers worldwide

**DCCI Impact:**
- **Static assets**: Images, CSS, JavaScript files
- **API responses**: Form submissions, dashboard data
- **PDF downloads**: DNREC reports and documents
- **Real-time updates**: Dashboard live updates

#### **Function Executions**
**What it is:**
- Serverless function runtime (API routes, middleware, etc.)
- Measured in GB-hours (memory × execution time)

**Why it costs money:**
- **Compute resources**: CPU and memory usage
- **Cold starts**: Function initialization overhead
- **Scaling**: Automatic scaling to handle demand
- **Monitoring**: Function performance tracking

**DCCI Impact:**
- **API routes**: Form submission handling, authentication
- **Middleware**: Route protection and session management
- **Edge functions**: Email notifications, data processing
- **Database operations**: Supabase integration

#### **Build Minutes**
**What it is:**
- Time spent building and deploying your application
- Includes dependency installation, compilation, and optimization

**Why it costs money:**
- **Build infrastructure**: Dedicated build servers
- **Dependency management**: Package installation and caching
- **Optimization**: Code splitting, minification, image optimization
- **Parallel builds**: Multiple builds running simultaneously

**DCCI Impact:**
- **Next.js builds**: App compilation and optimization
- **Dependency installation**: npm package installation
- **Image optimization**: Automatic image processing
- **Bundle analysis**: Code splitting and optimization

#### **Team Members**
**What it is:**
- Each person who has access to your Vercel project
- Includes developers, designers, and stakeholders

**Why it costs money:**
- **User management**: Account provisioning and management
- **Access control**: Role-based permissions and security
- **Collaboration features**: Team communication and coordination
- **Support**: Per-user support and assistance

**DCCI Impact:**
- **Development team**: Developers working on the project
- **Stakeholders**: Project managers and decision makers
- **Designers**: UI/UX team members
- **Content managers**: Staff updating content and data

### Usage Monitoring

#### **Bandwidth Monitoring**
```bash
# Check bandwidth usage in Vercel dashboard
# Go to: Project → Analytics → Bandwidth
# Monitor: Monthly usage, peak times, geographic distribution
```

**What to monitor:**
- **Monthly usage**: Track against your plan limits
- **Peak traffic**: Identify high-traffic periods
- **Geographic distribution**: Where your users are located
- **Asset optimization**: Large files consuming bandwidth

#### **Function Execution Monitoring**
```bash
# Check function usage in Vercel dashboard
# Go to: Project → Functions → Usage
# Monitor: Execution count, duration, memory usage
```

**What to monitor:**
- **Execution count**: Number of function calls
- **Duration**: How long functions take to run
- **Memory usage**: Memory consumption per function
- **Error rates**: Failed function executions

#### **Build Time Monitoring**
```bash
# Check build performance in Vercel dashboard
# Go to: Project → Deployments → Build Logs
# Monitor: Build duration, success rates, optimization
```

**What to monitor:**
- **Build duration**: Time spent building
- **Success rates**: Failed vs successful builds
- **Optimization**: Bundle size and performance
- **Dependencies**: Package installation time

### Cost Optimization Strategies

#### **Bandwidth Optimization**
- **Image optimization**: Use Next.js Image component
- **Code splitting**: Reduce bundle sizes
- **CDN caching**: Leverage Vercel's global CDN
- **Compression**: Enable gzip/brotli compression

#### **Function Optimization**
- **Efficient code**: Optimize function performance
- **Caching**: Cache expensive operations
- **Batch operations**: Combine multiple operations
- **Error handling**: Reduce failed executions

#### **Build Optimization**
- **Dependency management**: Remove unused packages
- **Build caching**: Leverage Vercel's build cache
- **Parallel builds**: Optimize build processes
- **Incremental builds**: Only rebuild changed code

### DCCI-Specific Cost Analysis

#### **Current Usage Patterns**
- **Bandwidth**: Low to moderate (form submissions, dashboard access)
- **Functions**: Low (authentication, form processing)
- **Builds**: Low (infrequent deployments)
- **Team**: Small (2-3 members)

#### **Cost Projections**
- **Hobby Plan**: $0/month (current usage)
- **Pro Plan**: $20-60/month (if team grows)
- **Team Plan**: $40-100/month (enterprise features)

#### **Scaling Considerations**
- **User growth**: More users = more bandwidth
- **Feature additions**: More functions = more executions
- **Team expansion**: More members = higher costs
- **Global reach**: International users = higher bandwidth

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Support](https://vercel.com/support)

---

**Last Updated**: December 2024  
**Domain**: h4i.plasticfreedelaware.org
