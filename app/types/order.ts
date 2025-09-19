import { OrderDetailFragment } from '~/generated/graphql';

export type OrderWithOptionalCreatedAt = Omit<
  OrderDetailFragment,
  'createdAt'
> & {
  createdAt?: any;
};
