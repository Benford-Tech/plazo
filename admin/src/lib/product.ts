import product from "../../../product.json";

// The product name is still a working name: never hard-code it elsewhere.
export const PRODUCT = { name: product.name, tagline: product.tagline } as const;
