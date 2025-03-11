export interface Action {
  type: string;
  filePath?: string;
  content: string;
}

export interface Artifact {
  title: string | null;
  id: string;
  response: string;
}

export interface Conversation {
  title: string | null;
  id: string;
}

export interface StreamCallback {
  (update: {
    type: string;
    status: string;
    action?: string;
    filePath?: string;
    command?: string;
    output?: string;
  }): void;
}

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface GenerateRequest {
  prompt: string;
  conversation: {
    history: ConversationMessage[] | [];
    title: string | "";
    id: string | "";
  } | null;
  // conversation: string;
}

export interface StreamUpdate {
  type?: string;
  status?: string;
  action?: string;
  error?: string;
  artifact?: Artifact;
}
