export type SpeedDialMenuItem = {
  readonly key: string;
  readonly icon: string;
  readonly label: string;
  readonly showLabel?: boolean;
  readonly isDisabled?: boolean;
  readonly row?: number;
  readonly keepOpenAfterPress?: boolean;
  readonly onSelect: () => void;
};

export type SpeedDialMenu = {
  readonly items: readonly SpeedDialMenuItem[];
};

export const emptySpeedDialMenu: SpeedDialMenu = { items: [] };
