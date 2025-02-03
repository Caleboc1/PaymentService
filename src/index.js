require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
global.prisma = prisma; // ✅ Make Prisma available globally

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

try {
    console.log('Loading routes...');
    
    const checkoutRoutes = require('./routes/checkout');
    const webhookRoutes = require('./routes/webhook');

    console.log('✅ Checkout Routes Loaded:', typeof checkoutRoutes); 
    console.log('✅ Webhook Routes Loaded:', typeof webhookRoutes); 
    
    app.use('/api/checkout', checkoutRoutes);
    app.use('/api/webhook', webhookRoutes);
    
    console.log('Routes loaded!');
    
    // ✅ Log registered routes only once at startup
    const registeredRoutes = app._router.stack
        .filter(r => r.route)
        .map(r => r.route.path);
    
    console.log('Registered routes:', registeredRoutes);
} catch (error) {
    console.error('Error loading routes:', error);
}

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Paystack service running on http://0.0.0.0:${PORT}`);
  });
  
