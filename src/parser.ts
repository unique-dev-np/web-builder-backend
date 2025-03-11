import { PerformAction } from "./action";
import { Action, Artifact, Conversation, StreamCallback } from "./types";

export async function parseXMLStream(
  stream: AsyncIterable<{ text: () => string }>,
  conversation: Conversation,
  streamCallback: StreamCallback
): Promise<{ artifact: Artifact }> {
  let artifact: Artifact = {
    title: conversation.title,
    id: conversation.id,
    response: "",
  };

  let response = "";
  let toProcess = "";
  let rawActions = [];

  console.log(stream, conversation, artifact);

  for await (const chunk of stream) {
    let chunkText = chunk.text();
    response += chunkText;
    toProcess += chunkText;

    if (!artifact.title) {
      const artifactData = extractArtifactTitle(response);
      artifact = { ...artifact, ...artifactData };
    }

    //To extract actions from the stream
    const { extractedActions, updatedText } =
      extractAndRemoveYugActions(toProcess);

    rawActions.push(...extractedActions);
    toProcess = updatedText;
    console.log("raw actions", rawActions);

    // perform action
    if (rawActions.length) {
      let extractedDetails = extractActionDetails(rawActions);
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

export function extractAndRemoveYugActions(text: string): {
  extractedActions: string[];
  updatedText: string;
} {
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

export function extractActionDetails(actions: string[]): Action[] {
  return actions
    .map((action): Action | null => {
      const regex =
        /<YUGACTION\s+type=(['"])(.*?)\1(?:\s+filePath=(['"])(.*?)\3)?\s*>([\s\S]*?)<\/YUGACTION>/;
      const match = action.match(regex);

      if (match) {
        const type = match[2];
        const filePath = match[4];
        const content = match[5].trim();

        return { type, filePath, content };
      }

      console.log("Failed to match action:", action);
      return null;
    })
    .filter((action): action is Action => action !== null);
}

function extractArtifactTitle(text: string): { title: string } | null {
  const regex = /<YUGARTIFACT\s+title="([^"]+)">/;

  // Match the YUGARTIFACT tag
  const match = text.match(regex);

  if (match) {
    const title = match[1]; // Extract the 'title' attribute
    return { title };
  }

  return null; // If no match is found, return null
}
