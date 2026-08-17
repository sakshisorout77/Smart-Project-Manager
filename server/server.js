const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
    res.send("Smart Project Manager API is running!");
});

app.post("/api/ai", async (req, res) => {

    try {

        const userPrompt = req.body.prompt;

        if (!userPrompt) {
            return res.status(400).json({
                error: "Please enter a prompt."
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: userPrompt
        });

        res.json({
            response: response.text
        });

    } catch (error) {

        console.error("AI Error:", error);

        res.status(500).json({
            error: "Unable to get AI response."
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});