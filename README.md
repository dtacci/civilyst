# Civilyst

Digital civic engagement platform for municipal development projects.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- Clerk account for authentication

### Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
   - `CLERK_SECRET_KEY`: From Clerk dashboard

### Installation

```bash
npm install
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (when connected to database)
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: tRPC, Prisma
- **Database**: PostgreSQL with PostGIS
- **Authentication**: Clerk
- **Deployment**: Vercel (frontend), Railway (backend)

## Features

- User authentication with Clerk
- Campaign creation and management
- Geographic search capabilities
- Real-time health monitoring
- Responsive mobile-first design

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npx prisma studio` - Open Prisma Studio
