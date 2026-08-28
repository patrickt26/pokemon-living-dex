import type { FormId } from './models';

const standardVariantAliases: Record<FormId, FormId> = {
  'form-201-a': 'form-201-default',
  'form-479-normal': 'form-479-default',
  'form-676-natural': 'form-676-default',
  'form-669-red': 'form-669-default',
  'form-670-red': 'form-670-default',
  'form-671-red': 'form-671-default',
};

export function normalizeVariantFormId(formId: FormId) {
  return standardVariantAliases[formId] ?? formId;
}

export function isStandardVariantAlias(formId: FormId) {
  return formId in standardVariantAliases;
}
