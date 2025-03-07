const { PerformAction } = require("./action");

async function parseXMLStream(stream, streamCallback) {
  let artifact = {
    started: false,
    title: undefined,
    id: undefined,
    response: "",
  };

  console.log("hello");

  let response = "";
  let toProcess = "";
  let rawActions = [];

  for await (const chunk of stream) {
    let chunkText = chunk.text();
    response += chunkText;
    toProcess += chunkText;

    // Send raw text update for streaming
    streamCallback({
      type: "stream",
      data: chunkText,
    });

    if (!artifact.started) {
      artifact.started = checkStartedYugArtifact(response);

      if (!artifact.started) continue;

      const artifactData = extractArtifactIdAndTitle(response);
      artifact = { ...artifact, ...artifactData };
    }

    //To extract actions from the stream
    const result = extractAndRemoveYugActions(toProcess);
    rawActions.push(...result.extractedActions);
    toProcess = result.updatedText;

    // perform action
    if (rawActions.length) {
      let extractedDetails = extractActionDetails(rawActions);
      console.log("🔍 Extracted details: ", extractedDetails);
      PerformAction(artifact, extractedDetails, streamCallback);
    }

    rawActions = [];
  }

  rawActions.push({
    type: "file",
    filePath: "yuganta/raw-response.txt",
    content: response,
  });

  PerformAction(artifact, rawActions, streamCallback);

  artifact.response = response;
  return { artifact };
}

function checkStartedYugArtifact(text) {
  const regex = /<YUGARTIFACT\s+id="[^"]+"\s+title="[^"]+">/;
  return regex.test(text);
}

function extractAndRemoveYugActions(text) {
  const regex = /<YUGACTION[^>]*>[\s\S]*?<\/YUGACTION>/g;

  // Extract the YUGACTION elements
  const extractedActions = text.match(regex) || [];

  // Remove the extracted YUGACTION elements from the original text
  const updatedText = text.replace(regex, "");

  return {
    extractedActions,
    updatedText,
  };
}

function extractActionDetails(actions) {
  return actions
    .map((action) => {
      // Regular expression to match the YUGACTION tag and extract attributes and content
      const regex =
        /<YUGACTION\s+type="([^"]+)"\s*(filePath="([^"]+)")?>([\s\S]*?)<\/YUGACTION>/;

      // Match the action
      const match = action.match(regex);

      if (match) {
        const type = match[1];
        const filePath = match[3] || null; // If 'filePath' exists, use it; otherwise, null
        const content = match[4].trim(); // Extract the content and trim unnecessary spaces

        return { type, filePath, content };
      }

      return null;
    })
    .filter((action) => action !== null); // Remove null entries (if any)
}

function extractArtifactIdAndTitle(text) {
  const regex = /<YUGARTIFACT\s+id="([^"]+)"\s+title="([^"]+)">/;

  // Match the YUGARTIFACT tag
  const match = text.match(regex);

  if (match) {
    const id = match[1]; // Extract the 'id' attribute
    const title = match[2]; // Extract the 'title' attribute
    return { id: `${id}-${Math.round(Math.random() * 10000)}`, title };
  }

  return null; // If no match is found, return null
}

module.exports = { parseXMLStream };
