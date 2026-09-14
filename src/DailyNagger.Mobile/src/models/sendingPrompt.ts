export type PendingSendingPrompt = {
  readonly title: string;
  readonly message: string;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel?: string;
  readonly technicalMessage: string;
};
