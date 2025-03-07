const { CurrentWorkingDirectory } = require("./constants");
const {
  executeShellCommandInDirectory,
  createFileWithDirectory,
} = require("./utils");

function PerformAction(artifact, actions, streamCallback) {
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

function fileAction(artifact, action, streamCallback) {
  streamCallback({ type: "file", status: "start", filePath: action.filePath });
  console.log("📁 Creating file: ", action.filePath);

  createFileWithDirectory(
    `${CurrentWorkingDirectory}/${artifact.id}/${action.filePath}`,
    action.content
  );
  console.log("📁 File created: ", action.filePath);

  streamCallback({
    type: "file",
    status: "complete",
    filePath: action.filePath,
  });
}

function shellAction(artifact, action, streamCallback) {
  streamCallback({ type: "shell", status: "start", command: action.content });

  executeShellCommandInDirectory(
    action.content,
    `${CurrentWorkingDirectory}/${artifact.id}`,
    (output) => {
      streamCallback({ type: "shell", status: "output", output });
    }
  );
}

module.exports = { PerformAction };
