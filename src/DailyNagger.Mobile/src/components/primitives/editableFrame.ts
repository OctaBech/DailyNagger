export const editableFrame = {
  borderColor: "#9fb7c3",
  borderRadius: 1,
  borderStyle: "dashed",
  borderWidth: 1,
} as const;

export const inactiveEditableFrame = {
  ...editableFrame,
  borderColor: "transparent",
  borderStyle: "solid",
} as const;
