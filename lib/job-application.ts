export type ApplicationStatus =
  | "applied"
  | "in_process"
  | "interview"
  | "positive_response"
  | "rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "applied",
  "in_process",
  "interview",
  "positive_response",
  "rejected",
];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Aplicado",
  in_process: "Em processo",
  interview: "Entrevista",
  positive_response: "Retorno positivo",
  rejected: "Recusado",
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as string[]).includes(value);
}
