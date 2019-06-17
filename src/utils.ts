/**
 * Get specificity of a delimited string
 */
export function specificity(val: string) {
    return val.split(/[^\w\d*?!\(\)\[\]](?!\*)/).length;
}
