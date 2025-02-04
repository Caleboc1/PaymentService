import('node-fetch').then(({ default: fetch }) => global.fetch = fetch);

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); // ✅ ADD THIS
const prisma = new PrismaClient();


router.post('/', async (req, res) => {
    console.log("✅ Received request on /api/checkout");

    const { email, amount, courseId, userId, callbackUrl } = req.body;

    try {
        // ✅ Validate User via Clerk API
        try {
            const userResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
                headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
            });

            if (!userResponse.ok) {
                return res.status(404).json({ error: "User not found in Clerk" });
            }

            const user = await userResponse.json();
        } catch (error) {
            console.error("Error validating user with Clerk:", error);
            return res.status(500).json({ error: "Failed to validate user" });
        }
// Fetch Course from Next.js API
try {
    const courseResponse = await fetch(`https://lms-microservice-test-paystack.vercel.app/api/courses/${courseId}`);

    if (!courseResponse.ok) {
        return res.status(404).json({ error: "Course not found or not published" });
    }

    const course = await courseResponse.json();
} catch (error) {
    console.error("Error fetching course:", error);
    return res.status(500).json({ error: "Failed to fetch course details" });
}


        // ✅ Initialize Paystack transaction
        const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
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

        const data = await paystackResponse.json();

        if (data.status) {
            return res.status(200).json({ authorizationUrl: data.data.authorization_url });
        } else {
            return res.status(400).json({ error: data.message });
        }
    } catch (error) {
        console.error('Error initializing transaction:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
