# BiteHub

BiteHub is a campus food ordering platform designed to connect students with local food vendors around their university campus. It provides a seamless ordering experience for students and a robust dashboard for vendors to manage their menus, orders, and store settings.

## 🌟 Features

### For Students
- **Campus-specific Filtering:** Browse vendors and menus specific to your campus or university.
- **Real-time Order Tracking:** Get updates on your order status.
- **Seamless Ordering:** Easy-to-use cart and checkout flow.
- **WhatsApp Notifications:** Receive order updates directly via WhatsApp.

### For Vendors
- **Vendor Dashboard:** Manage your store profile, operating hours, and contact details.
- **Menu Management:** Add, edit, toggle availability, and delete menu items.
- **Order Management:** View incoming orders and update their status (Pending, Preparing, Ready, Completed, Cancelled).
- **Automated Notifications:** Customers receive automated WhatsApp alerts when their order status changes.

### For Admins
- **Platform Management:** Oversee vendors, users, and platform settings.
- **Vendor Onboarding:** Vetting and account creation for new vendors.

## 🚀 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication:** [NextAuth v5 (Auth.js)](https://authjs.dev/)
- **State Management:** [React Query](https://tanstack.com/query/latest) (server state) + React Context (local state)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Email:** AWS SES + Nodemailer + React Email
- **File Uploads:** [Cloudinary](https://cloudinary.com/)
- **Notifications:** WhatsApp Business API (Meta)
- **Rate Limiting:** [Upstash Redis](https://upstash.com/)
- **Monitoring:** [Sentry](https://sentry.io/)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **pnpm** (Package manager used in this project)
- **MongoDB** (Local instance or Atlas URI)

## 🛠️ Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/legend4tech/BiteHub.git
   cd BiteHub
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file (or create a `.env.local` file) and fill in the required values based on the section below.
   ```bash
   touch .env.local
   ```

4. **Run the development server:**
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🔐 Environment Variables

You need to set up the following environment variables in your `.env.local` file for the application to function correctly:

### Core Configuration
```env
# URL of your Next.js application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Authentication Secret (Generate one using: openssl rand -base64 32)
AUTH_SECRET=your_nextauth_secret

# Maintenance mode toggle ("true" or "false")
MAINTENANCE_MODE=false
```

### Database
```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net
MONGODB_DB=bitehub_dev
```

### Email (AWS SES)
```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
EMAIL_FROM=BiteHub <no-reply@bitehubapp.com>
EMAIL_TOKEN_EXPIRY_MINUTES=60
PASSWORD_RESET_EXPIRY_MINUTES=15
```

### Media Uploads (Cloudinary)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Rate Limiting (Upstash Redis)
```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### WhatsApp Notifications (Meta API)
```env
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_webhook_verify_token
```

### Error Monitoring (Sentry)
```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contribution Guidelines](CONTRIBUTING.md) to understand our architectural patterns, coding standards, and how to submit a pull request. 

**Key Highlights:**
- Follow the strict **separation of concerns** (Pages, Components, Hooks, Services, Models).
- Ensure **all colors** use design tokens from `app/globals.css`. No hardcoded hex values or generic Tailwind colors.
- Run `pnpm run build` locally to ensure there are **zero TypeScript errors** before opening a PR.

## 📄 License

[MIT License](LICENSE)
