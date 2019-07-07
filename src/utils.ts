/**
 * Get specificity of a delimited string
 */
export function specificity(value: string): number {
    return value.split(/[^\w\d*?!()[\]](?!\*)/).length;
}
