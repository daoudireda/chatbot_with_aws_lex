import express from "express";
import bodyParser from "body-parser";
import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from "@aws-sdk/client-lex-runtime-v2";
import cors from "cors";
import dotenv from "dotenv";


const app = express();
const port = process.env.PORT || 8000;
app.use(bodyParser.json());
app.use(cors());
dotenv.config(); // Load environment variables from .env file

// Load environment variables - you should store these in .env file
const AWS_REGION = process.env.AWS_REGION;
const BOT_ID = process.env.BOT_ID; // Get this from your Lex bot console
const BOT_ALIAS_ID = process.env.BOT_ALIAS_ID; // Get this from your Lex bot console
const LOCALE_ID = process.env.LOCALE_ID; // Make sure this matches your bot's locale
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;



// Validate required environment variables
const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "BOT_ID",
  "BOT_ALIAS_ID",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

// Configure AWS Lex client
const lexClient = new LexRuntimeV2Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Validate Lex configuration
const validateLexConfig = async () => {
  try {
    const params = {
      botId: BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId: LOCALE_ID,
      sessionId: "test-session",
      text: "test",
    };

    const command = new RecognizeTextCommand(params);
    await lexClient.send(command);
    console.log("Lex configuration validated successfully");
  } catch (error) {
    console.error("Lex configuration validation failed:", error);
    if (error.message.includes("BotId/BotLocale combination")) {
      console.error(`
        Please verify your Lex bot configuration:
        - Bot ID: ${BOT_ID}
        - Bot Alias ID: ${BOT_ALIAS_ID}
        - Locale ID: ${LOCALE_ID}
        
        You can find these values in your AWS Lex console:
        1. Go to AWS Lex console
        2. Select your bot
        3. Bot ID is in the bot settings
        4. Bot Alias ID is in the Aliases tab
        5. Locale ID should match the language settings of your bot
      `);
    }
    throw error;
  }
};

app.post("/chat", async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const params = {
      botId: BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId: LOCALE_ID,
      sessionId: req.body.sessionId || `session-${Date.now()}`,
      text: req.body.message,
    };

    const command = new RecognizeTextCommand(params);
    const response = await lexClient.send(command);

    // Extract the bot's response
    const botMessage =
      response.messages?.[0]?.content || "No response from bot";

    res.json({
      message: botMessage,
      sessionId: params.sessionId,
      intentName: response.sessionState?.intent?.name,
    });
  } catch (error) {
    console.error("Error details:", error);

    let errorMessage = "Failed to process chat message";
    let statusCode = 500;

    // Handle specific AWS Lex errors
    if (error.name === "ResourceNotFoundException") {
      errorMessage =
        "Bot configuration is invalid. Please check Bot ID and Alias ID.";
      statusCode = 404;
    } else if (error.message.includes("BotId/BotLocale")) {
      errorMessage =
        "Invalid bot configuration. Please check Bot ID and Locale settings.";
      statusCode = 400;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
    });
  }
});

// Health check endpoint that also validates Lex config
app.get("/health", async (req, res) => {
  try {
    await validateLexConfig();
    res.json({
      status: "healthy",
      botId: BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId: LOCALE_ID,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Validate Lex configuration before starting the server
validateLexConfig()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(
      "Failed to start server due to invalid Lex configuration:",
      error
    );
    process.exit(1);
  });
