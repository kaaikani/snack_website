import gql from 'graphql-tag';
import { QueryOptions, sdk } from '~/graphqlWrapper';

export function activeChannel(options: QueryOptions) {
  return sdk
    .activeChannel(undefined, options)
    .then(({ activeChannel }) =>
      activeChannel.id == '5' ? activeChannel : null,
    );
}

gql`
  query activeChannel {
    activeChannel {
      id
      currencyCode
    }
  }
`;
