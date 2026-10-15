;(process.env as Record<string, string | undefined>).NODE_ENV = "test"
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-for-testing-12345"
process.env.MONGODB_URI = "mongodb://localhost:27017/bitehub_test"
