export const formatSlug = (str: string) => {
  return str.toLowerCase().replace(/ /g, "-");
};
