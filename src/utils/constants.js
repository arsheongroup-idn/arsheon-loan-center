export const FLOW = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'CONTACT_REQUIRED',
  'AGREEMENT',
  'FUNDED',
  'ACTIVE',
  'COMPLETED',
];

export const ALL_STATUSES = [...FLOW, 'REJECTED'];

export const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  CONTACT_REQUIRED: 'Contact Required',
  AGREEMENT: 'Agreement',
  FUNDED: 'Funded',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

// Allowed lifecycle. Enforced again by database.rules.json.
export const TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['CONTACT_REQUIRED'],
  CONTACT_REQUIRED: ['AGREEMENT'],
  AGREEMENT: ['FUNDED'],
  FUNDED: ['ACTIVE'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
};

export const TIMESTAMP_FIELD = {
  UNDER_REVIEW: 'reviewedAt',
  ACCEPTED: 'acceptedAt',
  REJECTED: 'rejectedAt',
  CONTACT_REQUIRED: 'contactedAt',
  AGREEMENT: 'agreementAt',
  FUNDED: 'fundedAt',
  ACTIVE: 'activeAt',
  COMPLETED: 'completedAt',
};
