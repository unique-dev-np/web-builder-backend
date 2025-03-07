const { execSync } = require("child_process");
const { spawn } = require("child_process");

const fs = require("fs");
const path = require("path");

function createFileWithDirectory(filePath, content) {
  const dirPath = path.dirname(filePath); // Get the directory path from the file path

  // Create directories synchronously if they do not exist
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(filePath, content);
}

// Function to execute shell command and stream its output to the client
function executeShellCommandInDirectory(command, dir, callback) {
  // Use spawn to run the command asynchronously
  const cmd = spawn(command, { cwd: dir, shell: true });

  // Stream the standard output (stdout) and send data to the callback (client)
  cmd.stdout.on("data", (data) => {
    callback(`stdout: ${data.toString()}`); // Send stdout data to client in real-time
  });

  // Stream the standard error (stderr) and send error data to the callback (client)
  cmd.stderr.on("error", (data) => {
    callback(`stderr: ${data.toString()}`); // Send stderr data to client in real-time
  });

  // Listen for the command to exit
  cmd.on("close", (code) => {
    if (code === 0) {
      callback("✅Command executed successfully");
    } else {
      callback(`❌Command failed with exit code ${code}`);
    }
  });
}

module.exports = { createFileWithDirectory, executeShellCommandInDirectory };
