// app/lib/hygraph.ts

import { GraphQLClient, gql } from 'graphql-request';

const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT;
if (!HYGRAPH_ENDPOINT) {
  throw new Error('HYGRAPH_ENDPOINT is not defined');
}

const client = new GraphQLClient(HYGRAPH_ENDPOINT);

export const CHANNEL_POSTALCODES_QUERY = gql`
  query ChannelPostalcode {
    channelPostalcodes {
      id
      cityName
      code
    }
  }
`;

export interface ChannelPostalcode {
  id: string;
  cityName: string;
  code: number[];
}

interface ChannelPostalcodesResponse {
  channelPostalcodes: ChannelPostalcode[];
}

export async function getChannelPostalcodes(): Promise<ChannelPostalcode[]> {
  const data: ChannelPostalcodesResponse = await client.request(
    CHANNEL_POSTALCODES_QUERY,
  );
  return data.channelPostalcodes;
}
