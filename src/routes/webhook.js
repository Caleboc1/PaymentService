const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const { log } = require("console");

const prisma = new PrismaClient();


router.post("/", async (req, res) => {
    console.log("✅ Received webhook from Paystack");

    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac("sha512", secret)
                        .update(JSON.stringify(req.body))
                        .digest("hex");

    // Uncomment this after testing to verify Paystack signature
    if (hash !== req.headers["x-paystack-signature"]) {
        console.log("❌ Invalid signature, request ignored");
        return res.status(401).json({ error: "Unauthorized" });
    }

    const event = req.body;
    console.log("✅ Webhook event received:", event.event);

    if (event.event === "charge.success") {
        const { reference, amount, metadata, customer, status } = event.data;
        const { userId, courseId } = metadata;

        if (!userId || !courseId) {
            console.error("❌ Missing metadata in webhook");
            return res.status(400).json({ error: "Invalid metadata" });
        }

        try {
            // ✅ Save the transaction in the Payment Service database
            const transaction = await prisma.transaction.upsert({
                where: { id: reference },  // ✅ Use Paystack reference as the unique ID
                update: {}, // No update needed if transaction exists
                create: {
                    id: reference,  // ✅ Ensure a unique transaction ID
                    reference,      // ✅ Add the missing reference field
                    userId,  
                    courseId,  
                    amount,  
                    email: customer.email,  
                    status  
                },
            });
            

            console.log("✅ Transaction recorded:", transaction);

            // ✅ Notify Next.js app to unlock the course
            const purchaseResponse = await axios.post(`https://lms-microservice-test-paystack.vercel.app/api/courses/purchase`, {
                userId,
                courseId,
            });
            log(purchaseResponse.status);
            if (purchaseResponse.status === 200) {
                console.log("✅ Course unlocked successfully in Next.js app");
            } else {
                console.error("❌ Failed to unlock course in Next.js app:", purchaseResponse.data);
            }

            return res.status(200).json({ message: "Transaction recorded and course unlocked" });
        } catch (error) {
            console.error("❌ Error processing webhook:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    res.sendStatus(200);
});

module.exports = router;
