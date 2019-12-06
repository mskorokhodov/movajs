export const css = (strings, ...values) => {
  const styleSheet = new CSSStyleSheet();
  styleSheet.replace(strings.reduce((string, index) => `${string}${values[index]}`));

  return styleSheet;
};