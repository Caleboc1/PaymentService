const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); // ✅ ADD THIS
const prisma = new PrismaClient();


router.post('/', async (req, res) => {
    console.log("✅ Received request on /api/checkout");

    res.status(200).json({ message: "Checkout route is working!" }); // ✅ REMOVE THIS AFTER TESTING

    const { email, amount, courseId, userId, callbackUrl } = req.body;

    try {
        // Validate user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course || !course.isPublished) {
            return res.status(404).json({ error: 'Course not found or not published' });
        }

        // Check if user already purchased course
        const existingPurchase = await prisma.purchase.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (existingPurchase) {
            return res.status(400).json({ error: 'Course already purchased' });
        }

        // Initialize Paystack transaction
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount,
                callback_url: callbackUrl,
                metadata: { courseId, userId },
            }),
        });

        const data = await response.json();

        if (data.status) {
            return res.status(200).json({ authorizationUrl: data.data.authorization_url }); // ✅ Add return
        } else {
            return res.status(400).json({ error: data.message }); // ✅ Add return
        }
    } catch (error) {
        console.error('Error initializing transaction:', error);
        return res.status(500).json({ error: 'Internal server error' }); // ✅ Add return
    }
});


module.exports = router;
