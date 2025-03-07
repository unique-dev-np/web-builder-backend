const express = require("express");

const { parseXMLStream } = require("./parser");

const { model } = require("./ai");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/generate", async (req, res) => {
  console.log(req.body);
  const prompt = req.body.prompt;

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const result = await model.generateContentStream(prompt);

    // Start processing the stream
    parseXMLStream(result.stream, (update) => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    })
      .then(({ artifact }) => {
        // End the stream when all actions are complete
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            rawResponse: artifact.response,
          })}\n\n`
        );
        res.end();
      })
      .catch((error) => {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
        );
        res.end();
      });
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
    );
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
