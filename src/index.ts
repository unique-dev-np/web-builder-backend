import express, { Request, Response } from "express";
import cors from "cors";
import { parseXMLStream } from "./parser";
import { model } from "./ai";
import { v4 as uuidv4 } from "uuid";
import { Conversation, GenerateRequest, StreamUpdate } from "./types";
import { Content, Part } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 1000;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

app.post(
  "/generate",
  async (req: Request<{}, {}, GenerateRequest>, res: Response) => {
    // Get prompt and conversationId from URL search params
    const prompt = req.body.prompt as string;
    const conversation = req.body
      .conversation as GenerateRequest["conversation"];

    // Initialize conversation if not provided
    const initializedConversation = {
      id: conversation?.id || uuidv4(),
      title: conversation?.title || null,
      history: conversation?.history || [],
    };

    console.log(JSON.stringify(initializedConversation));

    // If no prompt is provided, return an error
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");

    try {
      // Set up the contents for the conversation
      const contents = conversation?.history;

      console.log("\n \n Contents: ", JSON.stringify(contents));
      console.log("\n \n Prompt: ", prompt);

      // Generate the content stream
      const result = await model.generateContentStream({
        contents: [
          ...(contents as Content[]),
          { role: "user", parts: [{ text: prompt }] as Part[] },
        ],
      });

      // Start processing the stream
      parseXMLStream(
        result.stream,
        initializedConversation,
        (update: StreamUpdate) => {
          res.write(`data: ${JSON.stringify(update)}\n\n`);
        }
      )
        // When the stream is complete, write the final response
        .then(({ artifact }) => {
          console.log("Final response");

          res.write(
            `data: ${JSON.stringify({
              status: "completed",
              artifact: artifact,
            } as StreamUpdate)}\n\n`
          );
          res.end();
        })
        // If there is an error pasring the stream, write the error to the stream
        .catch((error: Error) => {
          res.write(
            `data: ${JSON.stringify({
              type: "error",
              error: error.message,
            } as StreamUpdate)}\n\n`
          );
          res.end();
        });
      // If there is an error in the side of LLM, write the error to the stream
    } catch (error) {
      if (error instanceof Error) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: error.message,
          } as StreamUpdate)}\n\n`
        );
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: "An unknown error occurred",
          } as StreamUpdate)}\n\n`
        );
      }
      res.end();
    }
  }
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
