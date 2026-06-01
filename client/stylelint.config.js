export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-order"],

  rules: {
    "selector-class-pattern": null,
    "no-descending-specificity": null,

    "order/properties-order": [
      {
        groupName: "Layout",
        properties: [
          "display",
          "flex",
          "flex-direction",
          "justify-content",
          "align-items",
          "width",
          "height",
          "gap",
        ],
      },

      {
        groupName: "Positioning",
        properties: ["position", "top", "bottom", "left", "right", "z-index"],
      },

      {
        groupName: "Typography",
        properties: [
          "font-family",
          "font-size",
          "font-weight",
          "line-height",
          "text-align",
        ],
      },

      {
        groupName: "Visual",
        properties: [
          "color",
          "background-color",
          "border",
          "border-radius",
          "transition",
          "box-shadow",
          "opacity",
          "cursor",
        ],
      },

      {
        groupName: "Spacing",
        properties: [
          "margin",
          "margin-top",
          "margin-bottom",
          "margin-left",
          "margin-right",
          "padding",
          "padding-top",
          "padding-bottom",
          "padding-left",
          "padding-right",
        ],
      },
    ],
  },
};
