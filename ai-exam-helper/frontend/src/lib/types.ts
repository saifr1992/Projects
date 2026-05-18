export type User = {
  id: number;
  email: string;
  name: string;
  role: "student" | "admin";
  created_at: string;
};

export type Paper = {
  id: number;
  title: string;
  subject: string;
  year: number;
  semester?: string | null;
  description?: string | null;
  file_name: string;
  uploaded_by: number;
  created_at: string;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type ChatSession = {
  id: number;
  title: string;
  created_at: string;
};

export type ChatSessionDetail = ChatSession & {
  messages: ChatMessage[];
};

export type QuizQuestionPublic = {
  question: string;
  options: string[];
};

export type Quiz = {
  id: number;
  paper_id: number | null;
  topic: string | null;
  questions: QuizQuestionPublic[];
  total: number;
  submitted: boolean;
  score: number | null;
  created_at: string;
};

export type QuizResultItem = {
  question: string;
  options: string[];
  selected: number;
  correct_index: number;
  is_correct: boolean;
  explanation: string;
};

export type QuizSubmission = {
  quiz_id: number;
  score: number;
  correct: number;
  total: number;
  results: QuizResultItem[];
};

export type QuizHistoryItem = {
  id: number;
  topic: string | null;
  paper_id: number | null;
  total: number;
  score: number | null;
  submitted: boolean;
  created_at: string;
};
