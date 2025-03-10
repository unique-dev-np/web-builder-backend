import express, { Request, Response } from "express";
import { parseXMLStream } from "./parser";
import { model } from "./ai";
import { v4 as uuidv4 } from "uuid";
import { GenerateRequest, StreamUpdate } from "./types";
import { Content, Part } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post(
  "/generate",
  async (req: Request<{}, {}, GenerateRequest>, res: Response) => {
    const { prompt, conversation } = req.body;

    // Initialize conversation if not provided
    const initializedConversation = {
      id: conversation?.id || uuidv4(),
      title: conversation?.title || null,
      history: conversation?.history || [],
    };

    // If no prompt is provided, return an error
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      // Set up the contents for the conversation
      const contents: Content[] = initializedConversation.history.map(
        (msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }] as Part[],
        })
      );

      // Generate the content stream
      const result = await model.generateContentStream({
        contents: [
          ...contents,
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
          res.write(
            `data: ${JSON.stringify({
              type: "complete",
              rawResponse: artifact.response,
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
