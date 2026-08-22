import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

type ExpandIndicatorProps = {
  readonly isExpanded: boolean;
  readonly hasExpandableContent: boolean;
  readonly color: string;
  readonly size?: number;
};

export const ExpandIndicator = ({
  isExpanded,
  hasExpandableContent,
  color,
  size = 24,
}: ExpandIndicatorProps) => {
  if (!hasExpandableContent) return null;

  return (
    <MaterialDesignIcons
      color={color}
      name={isExpanded ? "chevron-down" : "chevron-right"}
      size={size}
    />
  );
};
