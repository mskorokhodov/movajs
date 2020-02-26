export const css = (strings, ...values) => {
  const styleSheet = new CSSStyleSheet();
  styleSheet.replace(strings.reduce((acc, string, index) => `${acc}${string}${values[index] !== undefined ? values[index] : ''}`, ''));

  return styleSheet;
};