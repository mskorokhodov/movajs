import { TemplateResult } from 'lit-html';
import { templateProcessor } from './templateProcessor';

export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);