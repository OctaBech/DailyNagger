import { describe, expect, it, jest } from "@jest/globals";
import { Children, type ReactElement } from "react";
import { StyleSheet, Text, type ViewProps } from "react-native";
import { SvgXml } from "react-native-svg";
import { NaggerFrame } from "@/components/card/NaggerFrame";

jest.mock("react-native-svg", () => ({ SvgXml: () => null }));

describe("nagger thumbtack", () => {
  it("keeps the SVG outside the clipped card and does not intercept touches", () => {
    const frame = NaggerFrame({
      tone: "active",
      isPinned: true,
      children: <Text>Card content</Text>,
    });
    const [card, marker] = Children.toArray(frame.props.children) as ReactElement<ViewProps>[];
    expect(StyleSheet.flatten(frame.props.style).overflow).not.toBe("hidden");
    expect(StyleSheet.flatten(card.props.style).overflow).toBe("hidden");
    expect(marker.props.pointerEvents).toBe("none");
    expect(StyleSheet.flatten(marker.props.style).top).toBeLessThan(0);
    const svg = marker.props.children as ReactElement<{ xml: string; width: number }>;
    expect(svg.type).toBe(SvgXml);
    expect(svg.props.width).toBe(36);
    expect(svg.props.xml).toContain("feGaussianBlur");
  });

  it("does not render a thumbtack on unpinned cards", () => {
    const frame = NaggerFrame({ tone: "active", children: <Text>Card content</Text> });
    expect(Children.toArray(frame.props.children)).toHaveLength(1);
  });
});
