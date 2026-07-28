"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MinusCircle,
  Send,
  TriangleAlert,
} from "lucide-react";
import type { InterviewMessage } from "@/lib/gemini";

export type InterviewFeedbackDTO = {
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  rating: "strong" | "average" | "weak";
};

const RATING_CONFIG = {
  strong: {
    label: "Desempenho forte",
    icon: CheckCircle2,
    className:
      "border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  average: {
    label: "Desempenho mediano",
    icon: TriangleAlert,
    className:
      "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  weak: {
    label: "Desempenho fraco",
    icon: MinusCircle,
    className:
      "border-red-600/30 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200",
  },
} satisfies Record<
  InterviewFeedbackDTO["rating"],
  { label: string; icon: typeof CheckCircle2; className: string }
>;

export function InterviewChat({
  interviewId,
  initialMessages,
  initialFeedback,
}: {
  interviewId: string;
  initialMessages: InterviewMessage[];
  initialFeedback: InterviewFeedbackDTO | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasAnswered = messages.some((m) => m.role === "user");
  const isFinished = feedback !== null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, feedback]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError("Digite sua resposta antes de enviar.");
      return;
    }

    setIsSending(true);
    const optimisticMessages: InterviewMessage[] = [
      ...messages,
      { role: "user", content: answer.trim() },
    ];
    setMessages(optimisticMessages);
    setAnswer("");

    try {
      const response = await fetch(`/api/interview/${interviewId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answer.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível enviar sua resposta.");
      }

      setMessages(data.messages as InterviewMessage[]);
      setIsFinalQuestion(Boolean(data.isFinalQuestion));
    } catch (err) {
      setMessages(messages);
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleFinish() {
    setError(null);
    setIsFinishing(true);

    try {
      const response = await fetch(`/api/interview/${interviewId}/finish`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível encerrar a entrevista.");
      }

      setFeedback(data.feedback as InterviewFeedbackDTO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {messages.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      {isFinished ? (
        <InterviewFeedbackCard feedback={feedback} />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            {isFinalQuestion && (
              <p className="text-xs font-medium text-muted-foreground">
                Esta é a última pergunta. Responda e encerre a entrevista para ver seu
                feedback.
              </p>
            )}
            <form onSubmit={handleSend} className="flex flex-col gap-3">
              <Textarea
                placeholder="Digite sua resposta..."
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isSending || isFinishing}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="flex-1" disabled={isSending || isFinishing}>
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isSending ? "Enviando..." : "Enviar resposta"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasAnswered || isSending || isFinishing}
                  onClick={handleFinish}
                >
                  {isFinishing && <Loader2 className="size-4 animate-spin" />}
                  {isFinishing ? "Gerando feedback..." : "Encerrar e ver feedback"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: InterviewMessage }) {
  const isModel = message.role === "model";
  return (
    <div className={`flex ${isModel ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
          isModel
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function InterviewFeedbackCard({ feedback }: { feedback: InterviewFeedbackDTO | null }) {
  if (!feedback) return null;
  const config = RATING_CONFIG[feedback.rating];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback da entrevista</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className={`rounded-lg border p-4 ${config.className}`}>
          <div className="flex items-center gap-2 font-semibold">
            <Icon className="size-4 shrink-0" />
            {config.label}
          </div>
          <p className="pt-1 text-sm opacity-90">{feedback.summary}</p>
        </div>

        {feedback.strengths.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Pontos fortes</p>
            <ul className="list-disc space-y-1 pl-5 pt-1 text-sm text-muted-foreground">
              {feedback.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.improvementAreas.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Pontos a melhorar</p>
            <ul className="list-disc space-y-1 pl-5 pt-1 text-sm text-muted-foreground">
              {feedback.improvementAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
