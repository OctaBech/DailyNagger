export type ShellSpeedDialAction = "showMoodBar";

export type SpeedDialMenuItem = {
  readonly key: string;
  readonly label: string;
  readonly showLabel?: boolean;
  readonly isDisabled?: boolean;
  readonly row?: number;
  readonly keepOpenAfterPress?: boolean;
  readonly onSelect?: () => void;
  readonly shellAction?: ShellSpeedDialAction;
} & (
  | {
      readonly icon: string;
      readonly emoji?: never;
    }
  | {
      readonly emoji: string;
      readonly icon?: never;
    }
);

export type SpeedDialMenu = {
  readonly items: readonly SpeedDialMenuItem[];
};

export const emptySpeedDialMenu: SpeedDialMenu = { items: [] };
