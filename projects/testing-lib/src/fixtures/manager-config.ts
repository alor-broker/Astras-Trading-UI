interface ManagerConfigFixture {
  schemaVersion: 1;
  terminalUrl: string;
  clientDataUrl: string;
  clients: {clientId: string, displayName: string, refreshToken: string}[];
}

/** Synthetic credentials only. Shared by the standalone manager shell tests. */
export class ManagerConfigFixtures {
  static createConfig(): ManagerConfigFixture {
    return {
      schemaVersion: 1,
      terminalUrl: 'https://terminal.example.com/',
      clientDataUrl: 'https://identity.example.com',
      clients: [
        {clientId: 'client-a', displayName: 'Client A', refreshToken: 'synthetic-token-a'},
        {clientId: 'client-b', displayName: 'Client B', refreshToken: 'synthetic-token-b'}
      ]
    };
  }
}
