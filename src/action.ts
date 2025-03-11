import { CurrentWorkingDirectory } from "./constants";
import {
  executeShellCommandInDirectory,
  createFileWithDirectory,
} from "./utils";
import { Action, Artifact, StreamCallback } from "./types";

export function PerformAction(
  artifact: Artifact,
  actions: Action[],
  streamCallback: StreamCallback
): void {
  for (const action of actions) {
    switch (action.type) {
      case "file":
        fileAction(artifact, action, streamCallback);
        break;
      case "shell":
        shellAction(artifact, action, streamCallback);
        break;
    }
  }
}

function fileAction(
  artifact: Artifact,
  action: Action,
  streamCallback: StreamCallback
): void {
  streamCallback({
    type: "file",
    status: "update",
    action: "start",
    filePath: action.filePath,
  });

  createFileWithDirectory(
    `${CurrentWorkingDirectory}/${artifact.id}/${action.filePath}`,
    action.content
  );

  streamCallback({
    type: "file",
    status: "update",
    action: "complete",
    filePath: action.filePath,
  });
}

function shellAction(
  artifact: Artifact,
  action: Action,
  streamCallback: StreamCallback
): void {
  streamCallback({ type: "shell", status: "start", command: action.content });

  executeShellCommandInDirectory(
    action.content,
    `${CurrentWorkingDirectory}/${artifact.id}`,
    (output: string) => {
      streamCallback({ type: "shell", status: "output", output });
    }
  );
}
