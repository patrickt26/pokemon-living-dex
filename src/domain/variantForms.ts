import type { FormId } from './models';

const standardVariantAliases: Record<FormId, FormId> = {
  'form-201-a': 'form-201-default',
  'form-386-normal': 'form-386-default',
  'form-492-land': 'form-492-default',
  'form-479-normal': 'form-479-default',
  'form-676-natural': 'form-676-default',
  'form-422-west': 'form-422-default',
  'form-423-west': 'form-423-default',
  'form-666-meadow': 'form-666-default',
  'form-641-incarnate': 'form-641-default',
  'form-642-incarnate': 'form-642-default',
  'form-645-incarnate': 'form-645-default',
  'form-647-ordinary': 'form-647-default',
  'form-678-male': 'form-678-default',
  'form-718-50-percent': 'form-718-default',
  'form-720-confined': 'form-720-default',
  'form-774-red-core': 'form-774-default',
  'form-710-average': 'form-710-default',
  'form-711-average': 'form-711-default',
  'form-854-phony': 'form-854-default',
  'form-855-phony': 'form-855-default',
  'form-869-vanilla-cream-strawberry-sweet': 'form-869-default',
  'form-849-amped': 'form-849-default',
  'form-876-male': 'form-876-default',
  'form-801-regular-color': 'form-801-default',
  'form-893-regular': 'form-893-default',
  'form-901-regular': 'form-901-default',
  'form-902-male': 'form-902-default',
  'form-905-incarnate': 'form-905-default',
  'form-916-male': 'form-916-default',
  'form-925-family-of-four': 'form-925-default',
  'form-982-two-segment': 'form-982-default',
  'form-999-chest': 'form-999-default',
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
