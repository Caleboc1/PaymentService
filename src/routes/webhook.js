const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    console.log("✅ Received webhook from Paystack");

    const secret = process.env.PAYSTACK_SECRET_KEY; // ✅ Ensure this is set in your .env file
    const hash = crypto.createHmac("sha512", secret)
                        .update(JSON.stringify(req.body))
                        .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
        console.log("❌ Invalid signature, request ignored");
        return res.status(401).json({ error: "Unauthorized" });
    }

    const event = req.body;
    console.log("✅ Webhook event received:", event.event);

    if (event.event === "charge.success") {
        const { reference, amount, metadata, customer } = event.data;
        const { userId, courseId } = metadata;

        try {
            // ✅ Mark transaction as successful
            const transaction = await prisma.transaction.create({
                data: {
                    id: reference,
                    userId: userId,
                    courseId: courseId,
                    amount: amount / 100, // Paystack sends amount in kobo
                    email: customer.email,
                    status: "success",
                },
            });

            console.log("✅ Transaction saved:", transaction);

            // ✅ Update the user's purchase record
            await prisma.purchase.create({
                data: {
                    userId,
                    courseId,
                },
            });

            console.log("✅ Purchase recorded for user:", userId);

            return res.status(200).json({ message: "Transaction recorded" });
        } catch (error) {
            console.error("❌ Error saving transaction:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    res.sendStatus(200); // ✅ Always respond to Paystack
});

module.exports = router;

