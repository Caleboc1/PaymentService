const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); // ✅ ADD THIS
const prisma = new PrismaClient();


router.post('/', express.json(), async (req, res) => {
    const event = req.body;

    if (event.event === 'charge.success') {
        const { metadata } = event.data;

        if (!metadata || !metadata.courseId || !metadata.userId) {
            return res.status(400).send('Missing metadata');
        }

        try {
            // Record purchase in the database
            await prisma.purchase.create({
                data: {
                    userId: metadata.userId,
                    courseId: metadata.courseId,
                },
            });

            return res.status(200).send('Payment processed successfully');
        } catch (error) {
            console.error('Error updating database:', error);
            return res.status(500).send('Internal server error');
        }
    }

    res.status(400).send('Unhandled event type');
    console.log("✅ Received request on /api/webhook");  // Debugging log
    res.status(200).send("Webhook received!"); // ✅ TESTING RESPONSE
});

module.exports = router;
