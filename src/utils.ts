import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export function createFileWithDirectory(
  filePath: string,
  content: string
): void {
  const dirPath = path.dirname(filePath); // Get the directory path from the file path

  console.log("File Path", filePath);
  console.log("File Dir Path", dirPath);
  // Create directories synchronously if they do not exist
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(filePath, content);
}

// Function to execute shell command and stream its output to the client
export function executeShellCommandInDirectory(
  command: string,
  dir: string,
  callback: (output: string) => void
): void {
  console.log("Command", command);
  console.log("Cmd Dir", dir);

  // Use spawn to run the command asynchronously
  const cmd = spawn(command, { cwd: dir, shell: true });

  // Stream the standard output (stdout) and send data to the callback (client)
  cmd.stdout.on("data", (data: Buffer) => {
    callback(`stdout: ${data.toString()}`); // Send stdout data to client in real-time
  });

  // Stream the standard error (stderr) and send error data to the callback (client)
  cmd.stderr.on("error", (data: Error) => {
    callback(`stderr: ${data.toString()}`); // Send stderr data to client in real-time
  });

  // Listen for the command to exit
  cmd.on("close", (code: number) => {
    if (code === 0) {
      callback("✅Command executed successfully");
    } else {
      callback(`❌Command failed with exit code ${code}`);
    }
  });
}
